using System.Globalization;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Import;

public class ExcelKpiImporter : IExcelKpiImporter
{
    private static readonly string[] DateFormats =
    [
        "dd/MM/yyyy",  // European DD/MM/YYYY first — actual format used in this Excel
        "d/M/yyyy",    // European single-digit day/month
        "MM/dd/yyyy",  // US (used only when day > 12 in first position, i.e. unambiguous)
        "M/d/yyyy",    // US single-digit
        "yyyy-MM-dd",
        "dd.MM.yyyy",
        "yyyy/MM/dd",
        "dd-MM-yyyy",
        "yyyyMMdd",
        "yyyy-MM-ddTHH:mm:ss",
        "yyyy-MM-ddTHH:mm:ssZ"
    ];

    public Task<(IReadOnlyList<NormalizedKpiRecord> Records, IReadOnlyList<KpiImportErrorDto> Errors)> ImportAsync(
        Stream stream,
        string fileName,
        int departmentId,
        int? projectId = null,
        string? businessUnit = null,
        CancellationToken cancellationToken = default)
    {
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (ext is not (".xlsx" or ".xlsm" or ".xltx" or ".csv"))
        {
            var errors = new List<KpiImportErrorDto>
            {
                new() { Message = $"Unsupported file extension '{ext}'. Only .xlsx, .xlsm, and .csv files are supported." }
            };
            return Task.FromResult<(IReadOnlyList<NormalizedKpiRecord>, IReadOnlyList<KpiImportErrorDto>)>(([], errors));
        }

        if (ext == ".csv")
        {
            return Task.FromResult(ParseCsvStream(stream, fileName, departmentId, projectId, businessUnit));
        }

        return Task.FromResult(ParseExcelWorkbook(stream, fileName, departmentId, projectId, businessUnit));
    }

    private static (IReadOnlyList<NormalizedKpiRecord> Records, IReadOnlyList<KpiImportErrorDto> Errors) ParseExcelWorkbook(
        Stream stream,
        string fileName,
        int departmentId,
        int? projectId,
        string? businessUnit)
    {
        var records = new List<NormalizedKpiRecord>();
        var errors = new List<KpiImportErrorDto>();

        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.FirstOrDefault();
        if (worksheet == null)
        {
            errors.Add(new KpiImportErrorDto { Message = "The workbook contains no worksheets." });
            return (records, errors);
        }

        var usedRange = worksheet.RangeUsed();
        if (usedRange == null)
        {
            errors.Add(new KpiImportErrorDto { Message = "The selected worksheet is empty." });
            return (records, errors);
        }

        var rowCount = usedRange.RowCount();
        var columnCount = usedRange.ColumnCount();

        // 1. Detect header row
        var headerRowIndex = 1;
        for (var r = 1; r <= Math.Min(15, rowCount); r++)
        {
            var row = usedRange.Row(r);
            for (var c = 1; c <= columnCount; c++)
            {
                var text = row.Cell(c).GetString().Trim();
                if (IsKnownHeaderToken(text))
                {
                    headerRowIndex = r;
                    break;
                }
            }
            if (headerRowIndex > 1) break;
        }

        var headerRow = usedRange.Row(headerRowIndex);
        var headers = new List<(int Index, string Name)>();
        var seenHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var c = 1; c <= columnCount; c++)
        {
            var cellText = headerRow.Cell(c).GetString().Trim();
            if (string.IsNullOrWhiteSpace(cellText))
            {
                cellText = $"Column{c}";
            }
            else if (seenHeaders.Contains(cellText))
            {
                cellText = $"{cellText}_{c}";
            }

            seenHeaders.Add(cellText);
            headers.Add((c, cellText));
        }

        // 2. Parse data rows — per spec, do NOT deduplicate across rows.
        // Multiple rows sharing the same N° FicheM. are normal (one row per task).
        for (var r = headerRowIndex + 1; r <= rowCount; r++)
        {
            var row = usedRange.Row(r);
            var rowDict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            var formulaDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var hasAnyValue = false;

            foreach (var (index, name) in headers)
            {
                var cell = row.Cell(index);
                var cellValue = ExtractCellValueSafely(cell);

                if (cellValue != null && !(cellValue is string s && string.IsNullOrWhiteSpace(s)))
                {
                    hasAnyValue = true;
                }

                rowDict[name] = cellValue;

                if (cell.HasFormula)
                {
                    try
                    {
                        var formula = cell.FormulaA1;
                        if (!string.IsNullOrWhiteSpace(formula))
                        {
                            formulaDict[name] = formula;
                        }
                    }
                    catch
                    {
                        // Ignore formula reading failures
                    }
                }
            }

            if (!hasAnyValue)
            {
                continue;
            }

            var (record, rowErrors) = BuildNormalizedRecord(rowDict, formulaDict, r, fileName, departmentId, projectId, businessUnit);
            errors.AddRange(rowErrors);

            if (record != null)
            {
                records.Add(record);
            }
        }

        return (records, errors);
    }

    private static (IReadOnlyList<NormalizedKpiRecord> Records, IReadOnlyList<KpiImportErrorDto> Errors) ParseCsvStream(
        Stream stream,
        string fileName,
        int departmentId,
        int? projectId,
        string? businessUnit)
    {
        var records = new List<NormalizedKpiRecord>();
        var errors = new List<KpiImportErrorDto>();

        using var reader = new StreamReader(stream);
        var allLines = new List<string>();
        while (!reader.EndOfStream)
        {
            var l = reader.ReadLine();
            if (l != null) allLines.Add(l);
        }

        if (allLines.Count == 0)
        {
            errors.Add(new KpiImportErrorDto { Message = "CSV file is empty." });
            return (records, errors);
        }

        // Find header line
        var headerIndex = 0;
        var detectedDelimiter = ',';

        for (var i = 0; i < Math.Min(15, allLines.Count); i++)
        {
            var line = allLines[i];
            var delimiter = line.Contains(';') ? ';' : line.Contains('\t') ? '\t' : ',';
            var tokens = line.Split(delimiter).Select(t => t.Trim().Trim('"')).ToArray();

            if (tokens.Any(IsKnownHeaderToken))
            {
                headerIndex = i;
                detectedDelimiter = delimiter;
                break;
            }
        }

        var headerLine = allLines[headerIndex];
        var headers = headerLine.Split(detectedDelimiter).Select(h => h.Trim().Trim('"')).ToArray();

        for (var i = headerIndex + 1; i < allLines.Count; i++)
        {
            var line = allLines[i];
            if (string.IsNullOrWhiteSpace(line)) continue;

            var parts = line.Split(detectedDelimiter).Select(p => p.Trim().Trim('"')).ToArray();
            var rowDict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

            for (var h = 0; h < headers.Length && h < parts.Length; h++)
            {
                if (!string.IsNullOrWhiteSpace(headers[h]))
                {
                    rowDict[headers[h]] = parts[h];
                }
            }

            var (record, rowErrors) = BuildNormalizedRecord(rowDict, new Dictionary<string, string>(), i + 1, fileName, departmentId, projectId, businessUnit);
            errors.AddRange(rowErrors);

            if (record != null)
            {
                records.Add(record);
            }
        }

        return (records, errors);
    }

    private static object? ExtractCellValueSafely(IXLCell cell)
    {
        try
        {
            if (cell.IsEmpty())
            {
                return string.Empty;
            }

            if (cell.HasFormula)
            {
                var cached = cell.CachedValue;
                if (cached.IsNumber) return cached.GetNumber();
                if (cached.IsBoolean) return cached.GetBoolean();
                if (cached.IsDateTime)
                {
                    var str = cell.GetString()?.Trim();
                    if (!string.IsNullOrEmpty(str)) return str;
                    return cached.GetDateTime();
                }
                if (cached.IsText) return cached.GetText().Trim();
            }

            var val = cell.Value;
            if (val.IsNumber) return val.GetNumber();
            if (val.IsBoolean) return val.GetBoolean();
            if (val.IsDateTime)
            {
                // Return the cell's formatted display string so our EU-first date parser
                // (dd/MM/yyyy) handles the value. Returning the raw DateTime would bypass
                // that step and keep any US-serial ambiguity intact.
                var str = cell.GetString()?.Trim();
                if (!string.IsNullOrEmpty(str)) return str;
                return val.GetDateTime();
            }
            if (val.IsText) return val.GetText().Trim();

            return cell.GetString().Trim();
        }
        catch
        {
            try { return cell.GetString().Trim(); } catch { return string.Empty; }
        }
    }

    private static (NormalizedKpiRecord? Record, List<KpiImportErrorDto> Errors) BuildNormalizedRecord(
        Dictionary<string, object?> row,
        Dictionary<string, string> formulas,
        int rowIndex,
        string fileName,
        int departmentId,
        int? projectId,
        string? businessUnit)
    {
        var errors = new List<KpiImportErrorDto>();

        var title = GetString(row, "Tasks", "Title", "Désignation", "Designation", "Task", "Summary", "Description");
        var changeNo = GetString(row, "Change No.", "N° FicheM.", "ChangeNumber", "Key", "Issue Key", "ChangeNo");
        var assignee = GetString(row, "User", "Assignee", "AssigneeName", "Responsible", "Responsibl");
        var function = GetString(row, "Function", "MEC-Type", "MecType");
        var workItem = GetString(row, "WrkIt", "WorkItem", "Work Item");
        var respDept = GetString(row, "Resp_Dep", "ResponsibleDepartment", "Responsible Dept", "Division");
        var bu = GetString(row, "Bus. unit", "BusinessUnit", "BU") ?? businessUnit ?? "General";

        var sendDate = GetDate(row, rowIndex, errors, "Send date", "SendDate", "Created on", "CreatedDate");
        var dueDate = GetDate(row, rowIndex, errors, "End date", "DueDate", "Due Date");
        var completedDate = GetDate(row, rowIndex, errors, "Done", "CompletedAt", "CompletedDate", "Resolution Date");
        var initialDate = GetDate(row, rowIndex, errors, "Init/date", "Init.date", "InitialDate", "Initial Date");
        var forwardedDate = GetDate(row, rowIndex, errors, "Fwd. date", "ForwardedDate");

        // Fallback for title if only change number is present
        if (string.IsNullOrWhiteSpace(title) && !string.IsNullOrWhiteSpace(changeNo))
        {
            title = $"Item {changeNo}";
        }

        if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(changeNo))
        {
            return (null, errors);
        }

        // Compute application-owned metrics independently of Excel formulas
        var status = DetermineNormalizedStatus(completedDate, dueDate, sendDate);
        var delayDays = CalculateDelayDays(dueDate, completedDate);
        var leadTimeDays = CalculateLeadTimeDays(sendDate, completedDate ?? dueDate);
        var (isGreen, isYellow, isOrange, isRed) = ClassifyAdherenceColors(status, sendDate, dueDate, completedDate, initialDate);
        var month = ResolveMonth(sendDate, dueDate, completedDate, initialDate);

        var record = new NormalizedKpiRecord
        {
            DepartmentId = departmentId,
            ProjectId = projectId,
            Source = Path.GetExtension(fileName).Equals(".csv", StringComparison.OrdinalIgnoreCase) ? "Csv" : "Excel",
            SourceRecordId = changeNo,
            ChangeNumber = changeNo,
            Title = title?.Trim(),
            Description = GetString(row, "Description in ZLO_AEV", "Description", "Motif modification"),
            Status = status,
            Progress = status == "Done" ? 100m : (status == "InProgress" ? 50m : 0m),
            CreatedDate = sendDate,
            SendDate = sendDate,
            DueDate = dueDate,
            CompletedDate = completedDate,
            InitialDate = initialDate,
            ForwardedDate = forwardedDate,
            Assignee = assignee,
            ResponsibleName = assignee,
            ResponsibleDepartment = respDept,
            Function = function,
            WorkItem = workItem,
            BusinessUnit = bu,
            MecType = function,
            Month = month,
            Days = GetInt(row, "Days"),
            DelayDays = delayDays,
            LeadTimeDays = leadTimeDays,
            IsGreen = isGreen,
            IsYellow = isYellow,
            IsOrange = isOrange,
            IsRed = isRed,
            AdditionalFields = row,
            SourceFormulas = formulas,
        };

        return (record, errors);
    }

    private static (bool green, bool yellow, bool orange, bool red) ClassifyAdherenceColors(
        string status,
        DateTime? sendDate,
        DateTime? dueDate,
        DateTime? completedDate,
        DateTime? initialDate)
    {
        if (status == "Done")
        {
            if (dueDate.HasValue && completedDate.HasValue && completedDate.Value <= dueDate.Value)
            {
                return (true, false, false, false); // Green: Completed on or before due date
            }

            if (initialDate.HasValue && completedDate.HasValue && completedDate.Value <= initialDate.Value)
            {
                return (true, false, false, false); // Green: Completed within initial scheduled plan
            }

            return (false, true, false, false); // Yellow: Completed with acceptable variance
        }

        if (status == "InProgress" || status == "Planned")
        {
            var now = DateTime.UtcNow;
            if (dueDate.HasValue && dueDate.Value < now)
            {
                var delay = (now - dueDate.Value).TotalDays;
                if (delay > 14)
                {
                    return (false, false, false, true); // Red: Significantly overdue
                }
                return (false, false, true, false); // Orange: Moderately delayed
            }

            return (false, true, false, false); // Yellow: Active on track
        }

        return (false, false, false, true); // Red: Cancelled / Blocked
    }

    private static string DetermineNormalizedStatus(DateTime? completedDate, DateTime? dueDate, DateTime? sendDate)
    {
        var now = DateTime.UtcNow;
        // Only treat as Done if the completion date has actually passed — a future Done date
        // means it is the planned/target completion date, not actual completion.
        if (completedDate.HasValue && completedDate.Value <= now) return "Done";
        if (dueDate.HasValue && dueDate.Value < now) return "Delayed";
        if (sendDate.HasValue) return "InProgress";
        return "Planned";
    }

    private static int? CalculateDelayDays(DateTime? dueDate, DateTime? completedDate)
    {
        if (!dueDate.HasValue) return null;
        var end = completedDate ?? DateTime.UtcNow;
        if (end <= dueDate.Value) return 0;
        return (int)Math.Ceiling((end - dueDate.Value).TotalDays);
    }

    private static int? CalculateLeadTimeDays(DateTime? startDate, DateTime? endDate)
    {
        if (!startDate.HasValue || !endDate.HasValue) return null;
        return Math.Max(0, (int)Math.Ceiling((endDate.Value - startDate.Value).TotalDays));
    }

    private static string ResolveMonth(DateTime? sendDate, DateTime? dueDate, DateTime? completedDate, DateTime? initialDate)
    {
        var now = DateTime.UtcNow;
        // Completed tasks: month = when the task was actually finished.
        // Not-done tasks: month = when it was due (overdue pressure in the right period).
        // Future tasks: fall back to due date anyway for storage; the chart service excludes them at query time.
        if (completedDate.HasValue && completedDate.Value <= now)
            return completedDate.Value.Month.ToString();
        var targetDate = dueDate ?? sendDate ?? initialDate ?? now;
        return targetDate.Month.ToString();
    }

    private static string? GetString(Dictionary<string, object?> row, params string[] candidateHeaders)
    {
        foreach (var header in candidateHeaders)
        {
            if (row.TryGetValue(header, out var val) && val != null)
            {
                var str = val.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(str)) return str;
            }
        }
        return null;
    }

    private static int? GetInt(Dictionary<string, object?> row, params string[] candidateHeaders)
    {
        foreach (var header in candidateHeaders)
        {
            if (row.TryGetValue(header, out var val) && val != null)
            {
                if (val is int i) return i;
                if (val is double d) return (int)d;
                if (int.TryParse(val.ToString(), out var parsed)) return parsed;
            }
        }
        return null;
    }

    private static DateTime? GetDate(
        Dictionary<string, object?> row,
        int rowIndex,
        List<KpiImportErrorDto> errors,
        params string[] candidateHeaders)
    {
        foreach (var header in candidateHeaders)
        {
            if (row.TryGetValue(header, out var val) && val != null)
            {
                if (val is DateTime dt) return dt;
                if (val is double oaDate && oaDate > 0 && oaDate < 2958465)
                {
                    try { return DateTime.FromOADate(oaDate); } catch { }
                }

                var text = val.ToString()?.Trim();
                if (string.IsNullOrWhiteSpace(text)) continue;

                // Try explicit formats first (DateFormats list starts with M/d/yyyy per spec).
                // Explicit-format parsing avoids locale-dependent ambiguity (e.g. "6/1/2026"
                // being read as 6 Jan instead of 1 Jun).
                var parsed = default(DateTime);
                var matched = false;
                foreach (var format in DateFormats)
                {
                    if (DateTime.TryParseExact(text, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed))
                    {
                        matched = true;
                        break;
                    }
                }

                if (matched)
                {
                    return parsed;
                }

                if (DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed))
                {
                    return parsed;
                }

                errors.Add(new KpiImportErrorDto
                {
                    Row = rowIndex,
                    Column = header,
                    Value = text,
                    Message = $"Invalid date format '{text}'. Expected a valid calendar date (e.g. YYYY-MM-DD or DD/MM/YYYY)."
                });
            }
        }
        return null;
    }

    private static bool IsKnownHeaderToken(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        var norm = text.Trim();
        return string.Equals(norm, "Change No.", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Status", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Tasks", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Bus. unit", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Designation", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Désignation", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "N° FicheM.", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Responsible", StringComparison.OrdinalIgnoreCase);
    }
}
