namespace DashboardKpi.Domain.Entities
{
    public class DataProcessingApi : ExternalApi
    {
        public string? RulesJson { get; set; }

        public string? Notes { get; set; }
    }
}