namespace DashboardKpi.Domain.Entities;

public class RawKpiRecord
{
    public Dictionary<string, object?> Values { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string?> Formulas { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public string SourceType { get; set; } = string.Empty;

    public string? SourceIdentifier { get; set; }

    public int? RowIndex { get; set; }
}
