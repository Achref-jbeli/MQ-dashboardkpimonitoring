using System.Globalization;
using System.Text.RegularExpressions;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Extraction;

public class PerformanceDataExtractor
{
    public static bool LooksLikeEmployeeTaskImport(IReadOnlyCollection<RawKpiRecord> records)
    {
        return records.Any(r =>
            r.Values.ContainsKey("Change No.")
            && r.Values.ContainsKey("Tasks")
            && r.Values.ContainsKey("User"));
    }

    public static List<TaskItem> ParseTaskItems(
        IReadOnlyCollection<RawKpiRecord> records,
        int departmentId,
        int? projectId,
        string? businessUnit,
        string? responsibleDepartment)
    {
        var items = new List<TaskItem>();
        var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var record in records)
        {
            var row = record.Values;

            var title = ReadString(row, "Tasks") ?? ReadString(row, "Title");
            if (string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            var changeNo = ReadString(row, "Change No.") ?? ReadString(row, "ChangeNumber");
            var assigneeName = ReadString(row, "User") ?? ReadString(row, "AssigneeName");
            var function = ReadString(row, "Function");
            var workItem = ReadString(row, "WrkIt") ?? ReadString(row, "WorkItem");
            var sendDate = ParseDate(row, "Send date") ?? ParseDate(row, "SendDate");
            var dueDate = ParseDate(row, "End date") ?? ParseDate(row, "DueDate");
            var completedAt = ParseDate(row, "Done") ?? ParseDate(row, "CompletedAt");
            var initialDate = ParseDate(row, "Init.date") ?? ParseDate(row, "InitialDate");
            var forwardedDate = ParseDate(row, "Fwd. date") ?? ParseDate(row, "ForwardedDate");

            // Deduplication key
            var dedupKey = string.Join("|",
                NormalizeToken(changeNo),
                NormalizeToken(assigneeName),
                NormalizeToken(function),
                NormalizeToken(workItem),
                NormalizeTaskTitle(title),
                sendDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty,
                dueDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty,
                completedAt?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty);

            if (!seenKeys.Add(dedupKey))
            {
                continue;
            }

            var status = DetermineTaskStatus(completedAt, dueDate);
            var performanceScore = CalculateTaskPerformanceScore(status, sendDate, dueDate, completedAt);
            var progress = CalculateTaskProgress(status);

            var task = new TaskItem
            {
                DepartmentId = departmentId,
                ProjectId = projectId,
                Title = title.Trim(),
                Description = ReadString(row, "Description in ZLO_AEV") ?? ReadString(row, "Description"),
                ChangeNumber = changeNo,
                ReasonForChange = ReadString(row, "Reason for Change") ?? ReadString(row, "ReasonForChange"),
                BusinessUnit = ReadString(row, "Bus. unit") ?? ReadString(row, "BusinessUnit") ?? businessUnit,
                MecType = ReadString(row, "MEC-Type") ?? ReadString(row, "MecType"),
                Plant = ReadString(row, "Plant"),
                WbsElement = ReadString(row, "WBS Elem.") ?? ReadString(row, "WbsElement"),
                ResponsibleName = ReadString(row, "Responsibl") ?? ReadString(row, "ResponsibleName"),
                ResponsibleDepartment = NormalizeResponsibleDepartment(ReadString(row, "Resp_Dep") ?? ReadString(row, "ResponsibleDepartment")) ?? responsibleDepartment,
                CreatedBy = ReadString(row, "Created by") ?? ReadString(row, "CreatedBy"),
                CreatedOn = ParseDate(row, "Created on") ?? ParseDate(row, "CreatedOn"),
                WorkItem = workItem,
                AssigneeName = assigneeName,
                Function = function,
                SendDate = sendDate,
                DueDate = dueDate,
                CompletedAt = completedAt,
                InitialDate = initialDate,
                ForwardedDate = forwardedDate,
                Note = ReadString(row, "Note"),
                Days = ParseInt(row, "Days"),
                Status = status,
                Progress = progress,
                PerformanceScore = performanceScore,
                SourceMonth = ResolveSourceMonth(sendDate, dueDate, completedAt, initialDate),
            };

            items.Add(task);
        }

        return items;
    }

    private static string NormalizeTaskTitle(string raw)
    {
        var normalized = raw.Trim()
            .Replace("Produkt", "Product", StringComparison.OrdinalIgnoreCase)
            .Replace("  ", " ", StringComparison.OrdinalIgnoreCase);

        return NormalizeToken(normalized);
    }

    private static string NormalizeToken(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        return Regex.Replace(raw.Trim().ToUpperInvariant(), "\\s+", " ");
    }

    private static string DetermineTaskStatus(DateTime? completedAt, DateTime? dueDate)
    {
        if (completedAt.HasValue) return "Completed";
        if (dueDate.HasValue && dueDate.Value.Date < DateTime.UtcNow.Date) return "Delayed";
        return "Active";
    }

    private static int CalculateTaskProgress(string status) => status switch
    {
        "Completed" => 100,
        "Delayed" => 35,
        "Active" => 70,
        _ => 0,
    };

    private static int CalculateTaskPerformanceScore(string status, DateTime? sendDate, DateTime? dueDate, DateTime? completedAt)
    {
        if (string.Equals(status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            if (completedAt.HasValue && dueDate.HasValue && completedAt.Value.Date <= dueDate.Value.Date)
            {
                return 96;
            }
            return 78;
        }

        if (string.Equals(status, "Delayed", StringComparison.OrdinalIgnoreCase))
        {
            return 32;
        }

        if (sendDate.HasValue && dueDate.HasValue)
        {
            var totalDays = Math.Max(1, (dueDate.Value.Date - sendDate.Value.Date).Days);
            var elapsedDays = Math.Max(0, (DateTime.UtcNow.Date - sendDate.Value.Date).Days);
            var completion = Math.Clamp(1m - ((decimal)elapsedDays / totalDays), 0.2m, 0.85m);
            return (int)Math.Round(completion * 100m, MidpointRounding.AwayFromZero);
        }

        return 55;
    }

    private static string? NormalizeResponsibleDepartment(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var trimmed = raw.Trim();
        var dash = trimmed.IndexOf('-');
        return dash > 0 ? trimmed[..dash] : trimmed;
    }

    private static string ResolveSourceMonth(params DateTime?[] dates)
    {
        var selected = dates.FirstOrDefault(d => d.HasValue);
        return (selected ?? DateTime.UtcNow).ToString("yyyy-MM", CultureInfo.InvariantCulture);
    }

    private static string? ReadString(IReadOnlyDictionary<string, object?> row, string key)
    {
        if (row.TryGetValue(key, out var val) && val != null)
        {
            var s = val.ToString()?.Trim();
            return string.IsNullOrWhiteSpace(s) ? null : s;
        }
        return null;
    }

    private static DateTime? ParseDate(IReadOnlyDictionary<string, object?> row, string key)
    {
        if (!row.TryGetValue(key, out var val) || val == null) return null;
        if (val is DateTime dt) return dt;

        var str = val.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(str)) return null;

        var formats = new[] { "dd.MM.yyyy", "d.M.yyyy", "yyyy-MM-dd", "M/d/yyyy", "dd/MM/yyyy" };
        if (DateTime.TryParseExact(str, formats, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
        {
            return parsed;
        }
        if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out parsed))
        {
            return parsed;
        }
        return null;
    }

    private static int? ParseInt(IReadOnlyDictionary<string, object?> row, string key)
    {
        if (!row.TryGetValue(key, out var val) || val == null) return null;
        if (val is int i) return i;
        if (val is double d) return (int)d;
        if (int.TryParse(val.ToString()?.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
        {
            return parsed;
        }
        return null;
    }
}
