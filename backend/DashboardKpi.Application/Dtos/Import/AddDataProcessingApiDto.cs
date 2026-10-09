namespace DashboardKpi.Application.Dtos.Import;

public class AddDataProcessingApiDto
{
    public required string Name { get; set; }

    public string? BaseUrl { get; set; }

    public string? ApiKey { get; set; }

    public required int ProjectId { get; set; }

    public string? RulesJson { get; set; }

    public string? Notes { get; set; }
}
