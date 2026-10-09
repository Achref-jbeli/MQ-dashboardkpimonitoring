namespace DashboardKpi.Domain.Entities
{
    public class DataExtractionApi : ExternalApi
    {
        public string SourceType { get; set; } = "Csv";

        public string? EndpointPath { get; set; }

        public string CsvDelimiter { get; set; } = ",";
    }
}