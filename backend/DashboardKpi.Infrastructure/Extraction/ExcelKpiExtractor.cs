using ClosedXML.Excel;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Extraction;

public class ExcelKpiExtractor : IKpiDataExtractor
{
    public string SourceType => "Excel";

    public Task<IReadOnlyList<RawKpiRecord>> ExtractAsync(
        Stream stream,
        string? contextInfo = null,
        CancellationToken cancellationToken = default)
    {
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.FirstOrDefault();
        if (worksheet == null)
        {
            return Task.FromResult<IReadOnlyList<RawKpiRecord>>([]);
        }

        var usedRange = worksheet.RangeUsed();
        if (usedRange == null)
        {
            return Task.FromResult<IReadOnlyList<RawKpiRecord>>([]);
        }

        var rowCount = usedRange.RowCount();
        var columnCount = usedRange.ColumnCount();
        if (rowCount < 1 || columnCount < 1)
        {
            return Task.FromResult<IReadOnlyList<RawKpiRecord>>([]);
        }

        // Header detection: scan first 10 rows for known header tokens or first row with text
        var headerRowIndex = 1;
        for (var r = 1; r <= Math.Min(15, rowCount); r++)
        {
            var row = usedRange.Row(r);
            var isHeaderCandidate = false;
            for (var c = 1; c <= columnCount; c++)
            {
                var text = row.Cell(c).GetString().Trim();
                if (IsKnownHeaderToken(text))
                {
                    headerRowIndex = r;
                    isHeaderCandidate = true;
                    break;
                }
            }

            if (isHeaderCandidate)
            {
                break;
            }
        }

        // If no known token matched, find first non-empty row
        if (headerRowIndex == 1)
        {
            for (var r = 1; r <= Math.Min(15, rowCount); r++)
            {
                var row = usedRange.Row(r);
                var hasAny = false;
                for (var c = 1; c <= columnCount; c++)
                {
                    if (!string.IsNullOrWhiteSpace(row.Cell(c).GetString()))
                    {
                        hasAny = true;
                        break;
                    }
                }
                if (hasAny)
                {
                    headerRowIndex = r;
                    break;
                }
            }
        }

        var headerRow = usedRange.Row(headerRowIndex);
        var headers = new List<HeaderColumn>();
        var seenHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var c = 1; c <= columnCount; c++)
        {
            var cell = headerRow.Cell(c);
            var headerText = cell.GetString().Trim();
            var colLetter = IndexToColumnLetter(c);

            if (string.IsNullOrWhiteSpace(headerText))
            {
                headerText = $"Column{c}";
            }
            else if (seenHeaders.Contains(headerText))
            {
                headerText = $"{headerText}_{c}";
            }

            seenHeaders.Add(headerText);
            headers.Add(new HeaderColumn(c, colLetter, headerText));
        }

        var records = new List<RawKpiRecord>();

        for (var r = headerRowIndex + 1; r <= rowCount; r++)
        {
            var row = usedRange.Row(r);
            var record = new RawKpiRecord
            {
                SourceType = SourceType,
                SourceIdentifier = contextInfo,
                RowIndex = r
            };

            var hasData = false;

            foreach (var header in headers)
            {
                var cell = row.Cell(header.ColumnIndex);
                var cellValue = ExtractCellValue(cell);

                if (cellValue != null && !(cellValue is string s && string.IsNullOrWhiteSpace(s)))
                {
                    hasData = true;
                }

                record.Values[header.HeaderName] = cellValue;
                record.Values[header.ColumnLetter] = cellValue;
                record.Values[$"Column{header.ColumnIndex}"] = cellValue;

                if (cell.HasFormula)
                {
                    var formula = cell.FormulaA1;
                    if (!string.IsNullOrWhiteSpace(formula))
                    {
                        record.Formulas[header.HeaderName] = formula;
                        record.Formulas[header.ColumnLetter] = formula;
                        record.Formulas[$"Column{header.ColumnIndex}"] = formula;
                    }
                }
            }

            if (hasData)
            {
                records.Add(record);
            }
        }

        return Task.FromResult<IReadOnlyList<RawKpiRecord>>(records);
    }

    private static object? ExtractCellValue(IXLCell cell)
    {
        if (cell.IsEmpty())
        {
            return string.Empty;
        }

        var dataType = cell.DataType;
        return dataType switch
        {
            XLDataType.Boolean => cell.GetBoolean(),
            XLDataType.Number => cell.GetDouble(),
            XLDataType.DateTime => cell.GetDateTime(),
            XLDataType.TimeSpan => cell.GetTimeSpan().ToString(),
            XLDataType.Text => cell.GetString().Trim(),
            _ => cell.GetString().Trim(),
        };
    }

    private static bool IsKnownHeaderToken(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var norm = text.Trim();
        return string.Equals(norm, "Change No.", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Status", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Issue Status", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Tasks", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Bus. unit", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Designation", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Désignation", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "N° FicheM.", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Responsible", StringComparison.OrdinalIgnoreCase);
    }

    private static string IndexToColumnLetter(int columnNumber)
    {
        var dividend = columnNumber;
        var columnName = string.Empty;

        while (dividend > 0)
        {
            var modulo = (dividend - 1) % 26;
            columnName = Convert.ToChar('A' + modulo) + columnName;
            dividend = (dividend - modulo) / 26;
        }

        return columnName;
    }

    private sealed record HeaderColumn(int ColumnIndex, string ColumnLetter, string HeaderName);
}
