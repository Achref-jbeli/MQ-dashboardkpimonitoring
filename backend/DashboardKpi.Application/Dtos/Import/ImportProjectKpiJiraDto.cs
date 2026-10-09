namespace DashboardKpi.Application.Dtos.Import;

public class ImportProjectKpiJiraDto
{
    public required int ProjectId { get; set; }

    public required int ExtractionApiId { get; set; }

    public string? JiraJql { get; set; }
}
