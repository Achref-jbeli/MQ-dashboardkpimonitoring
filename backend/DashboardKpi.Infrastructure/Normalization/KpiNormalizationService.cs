using System.Globalization;
using System.Text.Json;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Normalization;

public class KpiNormalizationService : IKpiNormalizationService
{
    private readonly IExcelFormulaProcessor _formulaProcessor;

    public KpiNormalizationService(IExcelFormulaProcessor formulaProcessor)
    {
        _formulaProcessor = formulaProcessor;
    }

    public IReadOnlyList<NormalizedKpiRecord> NormalizeRecords(
        IReadOnlyCollection<RawKpiRecord> rawRecords,
        string? rulesJson = null)
    {
        if (rawRecords.Count == 0)
        {
            return [];
        }

        var rules = ParseProcessingRules(rulesJson);
        var normalizedList = new List<NormalizedKpiRecord>(rawRecords.Count);

        foreach (var raw in rawRecords)
        {
            var row = new Dictionary<string, object?>(raw.Values, StringComparer.OrdinalIgnoreCase);

            // If formulas are present, evaluate them
            if (raw.Formulas.Count > 0)
            {
                foreach (var (key, formula) in raw.Formulas)
                {
                    if (!string.IsNullOrWhiteSpace(formula))
                    {
                        var evaluated = _formulaProcessor.EvaluateFormula(formula, row, raw.RowIndex);
                        if (evaluated != null)
                        {
                            row[$"{key}_FormulaCalculated"] = evaluated;
                            row[key] = evaluated;
                        }
                    }
                }
            }

            var identifier = raw.SourceIdentifier
                ?? ReadMappedString(row, rules, "identifier", ["Change No.", "ChangeNumber", "SheetNumber", "N° FicheM.", "Key", "Id"]);

            var status = ReadMappedString(row, rules, "status", ["Status", "Issue Status", "IssueStatus", "TaskStatus"]);
            var progress = ReadMappedDecimal(row, rules, "progress", ["Progress", "Progress %", "Completion", "Completion %"]);
            var createdDate = ReadMappedDate(row, rules, "created", ["Created", "Created Date", "CreatedDate", "Created on", "CreatedOn"]);
            var dueDate = ReadMappedDate(row, rules, "duedate", ["DueDate", "Due Date", "Due", "End date", "EndDate"]);
            var completedDate = ReadMappedDate(row, rules, "resolutiondate", ["ResolutionDate", "Resolution Date", "Resolved", "Done", "DoneDate", "CompletedAt"]);
            var businessUnit = ReadMappedString(row, rules, "businessunit", ["Bus. unit", "BusinessUnit", "Business Unit"]);

            var normalized = new NormalizedKpiRecord
            {
                Identifier = identifier,
                Status = status,
                Progress = progress,
                CreatedDate = createdDate,
                DueDate = dueDate,
                CompletedDate = completedDate,
                BusinessUnit = businessUnit,
            };

            foreach (var (k, v) in row)
            {
                normalized.AdditionalFields[k] = v;
            }

            normalizedList.Add(normalized);
        }

        return normalizedList;
    }

    private static ProcessingRules ParseProcessingRules(string? rulesJson)
    {
        var rules = ProcessingRules.CreateDefault();
        if (string.IsNullOrWhiteSpace(rulesJson))
        {
            return rules;
        }

        try
        {
            using var document = JsonDocument.Parse(rulesJson);
            var root = document.RootElement;

            if (root.TryGetProperty("columnMap", out var colMapEl) && colMapEl.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in colMapEl.EnumerateObject())
                {
                    var key = NormalizeKey(prop.Name);
                    var header = prop.Value.GetString();
                    if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(header))
                    {
                        rules.ColumnMap[key] = header.Trim();
                    }
                }
            }

            if (root.TryGetProperty("doneStatuses", out var doneEl) && doneEl.ValueKind == JsonValueKind.Array)
            {
                rules.DoneStatuses = doneEl.EnumerateArray()
                    .Where(x => x.ValueKind == JsonValueKind.String)
                    .Select(x => x.GetString()?.Trim() ?? string.Empty)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
            }

            if (root.TryGetProperty("delayedStatuses", out var delayEl) && delayEl.ValueKind == JsonValueKind.Array)
            {
                rules.DelayedStatuses = delayEl.EnumerateArray()
                    .Where(x => x.ValueKind == JsonValueKind.String)
                    .Select(x => x.GetString()?.Trim() ?? string.Empty)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
            }
        }
        catch
        {
            return ProcessingRules.CreateDefault();
        }

        return rules;
    }

    private static string? ReadMappedString(
        IReadOnlyDictionary<string, object?> row,
        ProcessingRules rules,
        string canonicalKey,
        IReadOnlyList<string> aliases)
    {
        if (rules.ColumnMap.TryGetValue(canonicalKey, out var header)
            && row.TryGetValue(header, out var mappedVal)
            && mappedVal != null)
        {
            var s = mappedVal.ToString()?.Trim();
            if (!string.IsNullOrWhiteSpace(s)) return s;
        }

        foreach (var alias in aliases)
        {
            if (row.TryGetValue(alias, out var aliasVal) && aliasVal != null)
            {
                var s = aliasVal.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(s)) return s;
            }
        }

        return null;
    }

    private static decimal? ReadMappedDecimal(
        IReadOnlyDictionary<string, object?> row,
        ProcessingRules rules,
        string canonicalKey,
        IReadOnlyList<string> aliases)
    {
        if (rules.ColumnMap.TryGetValue(canonicalKey, out var header)
            && row.TryGetValue(header, out var mappedVal))
        {
            var d = ToDecimal(mappedVal);
            if (d.HasValue) return d;
        }

        foreach (var alias in aliases)
        {
            if (row.TryGetValue(alias, out var aliasVal))
            {
                var d = ToDecimal(aliasVal);
                if (d.HasValue) return d;
            }
        }

        return null;
    }

    private static DateTime? ReadMappedDate(
        IReadOnlyDictionary<string, object?> row,
        ProcessingRules rules,
        string canonicalKey,
        IReadOnlyList<string> aliases)
    {
        if (rules.ColumnMap.TryGetValue(canonicalKey, out var header)
            && row.TryGetValue(header, out var mappedVal))
        {
            var dt = ToDateTime(mappedVal);
            if (dt.HasValue) return dt;
        }

        foreach (var alias in aliases)
        {
            if (row.TryGetValue(alias, out var aliasVal))
            {
                var dt = ToDateTime(aliasVal);
                if (dt.HasValue) return dt;
            }
        }

        return null;
    }

    private static decimal? ToDecimal(object? val)
    {
        if (val == null) return null;
        if (val is decimal d) return d;
        if (val is int i) return i;
        if (val is double db) return (decimal)db;

        var str = val.ToString()?.Trim().TrimEnd('%');
        if (string.IsNullOrWhiteSpace(str)) return null;

        if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out var inv)) return inv;
        if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.CurrentCulture, out var cur)) return cur;

        return null;
    }

    private static DateTime? ToDateTime(object? val)
    {
        if (val == null) return null;
        if (val is DateTime dt) return dt;

        var str = val.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(str)) return null;

        var formats = new[] { "yyyy-MM-dd", "dd.MM.yyyy", "d.M.yyyy", "dd/MM/yyyy", "M/d/yyyy", "yyyy/MM/dd", "dd-MM-yyyy" };
        if (DateTime.TryParseExact(str, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var exact)) return exact;
        if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var inv)) return inv;

        return null;
    }

    private static string NormalizeKey(string raw)
    {
        return raw.Trim().Replace(" ", "").Replace("_", "").ToLowerInvariant();
    }

    private sealed class ProcessingRules
    {
        public Dictionary<string, string> ColumnMap { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        public HashSet<string> DoneStatuses { get; set; } = new(StringComparer.OrdinalIgnoreCase)
        {
            "Done", "Closed", "Resolved", "Completed"
        };

        public HashSet<string> DelayedStatuses { get; set; } = new(StringComparer.OrdinalIgnoreCase)
        {
            "Delayed", "Blocked", "On Hold", "OnHold"
        };

        public static ProcessingRules CreateDefault() => new();
    }
}
