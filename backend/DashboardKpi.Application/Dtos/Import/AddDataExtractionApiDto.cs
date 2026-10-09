namespace DashboardKpi.Application.Dtos.Import;

public class AddDataExtractionApiDto
{
    public required string Name { get; set; }

    public string? BaseUrl { get; set; }

    public string? ApiKey { get; set; }

    public required int ProjectId { get; set; }

    public string SourceType { get; set; } = "Csv";

    public string? EndpointPath { get; set; }

    public string CsvDelimiter { get; set; } = ",";
}
