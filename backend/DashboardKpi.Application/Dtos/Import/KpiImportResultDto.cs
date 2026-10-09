using DashboardKpi.Application.Dtos.Kpi;

namespace DashboardKpi.Application.Dtos.Import;

public class KpiImportResultDto
{
    public int BatchId { get; set; }

    public bool Success { get; set; } = true;

    public string Status { get; set; } = "Completed";

    public int? ProjectId { get; set; }

    public int DepartmentId { get; set; }

    public string? PerformanceUnit { get; set; }

    public string? BusinessUnit { get; set; }

    public int TotalRows { get; set; }

    public int ImportedCount { get; set; }

    public int UpdatedCount { get; set; }

    public int FailedCount { get; set; }

    public DateTime ImportedAtUtc { get; set; } = DateTime.UtcNow;

    public List<KpiImportErrorDto> Errors { get; set; } = new();

    public Dictionary<string, decimal> CalculatedMetrics { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public List<KpiCalculationResultDto> KpiResults { get; set; } = new();
}
