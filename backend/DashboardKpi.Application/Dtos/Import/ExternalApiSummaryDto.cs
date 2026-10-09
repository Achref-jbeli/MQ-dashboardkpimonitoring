namespace DashboardKpi.Application.Dtos.Import;

public class ExternalApiSummaryDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Kind { get; set; } = string.Empty;

    public int ProjectId { get; set; }

    public int DepartmentId { get; set; }

    public bool IsActive { get; set; }

    public DateTime? LastSyncedAtUtc { get; set; }
}
