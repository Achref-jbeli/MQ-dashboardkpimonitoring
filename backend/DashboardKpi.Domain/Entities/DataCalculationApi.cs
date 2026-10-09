namespace DashboardKpi.Domain.Entities
{
    public class DataCalculationApi : ExternalApi
    {
        public string KpiLabel { get; set; } = string.Empty;

        public string FormulaExpression { get; set; } = string.Empty;

        public string Unit { get; set; } = "%";

        public int DecimalPlaces { get; set; } = 2;
    }
}