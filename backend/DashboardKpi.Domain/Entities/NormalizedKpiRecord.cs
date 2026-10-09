namespace DashboardKpi.Domain.Entities;

public class NormalizedKpiRecord
{
    public int? DepartmentId { get; set; }

    public int? ProjectId { get; set; }

    public string Source { get; set; } = "Excel";

    public string? SourceRecordId { get; set; }

    public string? Identifier { get => SourceRecordId; set => SourceRecordId = value; }

    public string? ChangeNumber { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public string? Status { get; set; }

    public decimal? Progress { get; set; }

    public DateTime? CreatedDate { get; set; }

    public DateTime? SendDate { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    public DateTime? InitialDate { get; set; }

    public DateTime? ForwardedDate { get; set; }

    public string? Assignee { get; set; }

    public string? ResponsibleName { get; set; }

    public string? ResponsibleDepartment { get; set; }

    public string? Team { get; set; }

    public string? Function { get; set; }

    public string? WorkItem { get; set; }

    public string? BusinessUnit { get; set; }

    public string? MecType { get; set; }

    public string? Month { get; set; }

    public int? Days { get; set; }

    public int? DelayDays { get; set; }

    public int? LeadTimeDays { get; set; }

    public bool IsGreen { get; set; }

    public bool IsYellow { get; set; }

    public bool IsOrange { get; set; }

    public bool IsRed { get; set; }

    public decimal? PerformanceScore { get; set; }

    public Dictionary<string, object?> AdditionalFields { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> SourceFormulas { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
