namespace DashboardKpi.Application.Dtos.Import;

public class ImportProjectKpiCsvDto
{
    public int? ProjectId { get; set; }

    public string? PerformanceUnit { get; set; }

    public string? BusinessUnit { get; set; }

    public int? ExtractionApiId { get; set; }
}
