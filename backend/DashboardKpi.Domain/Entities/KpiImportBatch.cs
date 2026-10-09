namespace DashboardKpi.Domain.Entities;

public class KpiImportBatch
{
    public int Id { get; set; }

    public int DepartmentId { get; set; }

    public int? ProjectId { get; set; }

    public string SourceType { get; set; } = "Excel";

    public string? FileName { get; set; }

    public DateTime ImportedAtUtc { get; set; } = DateTime.UtcNow;

    public string Status { get; set; } = "Started";

    public int TotalRows { get; set; }

    public int SuccessfulRows { get; set; }

    public int FailedRows { get; set; }

    public string? ErrorMessage { get; set; }

    public string? DetailsJson { get; set; }

    public Department? Department { get; set; }

    public Project? Project { get; set; }
}
