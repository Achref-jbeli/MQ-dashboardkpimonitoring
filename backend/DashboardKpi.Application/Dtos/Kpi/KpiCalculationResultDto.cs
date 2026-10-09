namespace DashboardKpi.Application.Dtos.Kpi;

public class KpiCalculationResultDto
{
    public string Code { get; set; } = "ADHERENCE_TO_SCHEDULE";

    public string Name { get; set; } = "Adherence to Schedule";

    public decimal Value { get; set; }

    public string Unit { get; set; } = "%";

    public int GreenCount { get; set; }

    public int YellowCount { get; set; }

    public int OrangeCount { get; set; }

    public int RedCount { get; set; }

    public int TotalCount { get; set; }

    public string Formula { get; set; } = string.Empty;

    public Dictionary<string, decimal> MetricVariables { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, MonthlyAdherenceDto> MonthlyBreakdown { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
