namespace DashboardKpi.Application.Dtos.Import;

public class AddDataCalculationApiDto
{
    public required string Name { get; set; }

    public string? BaseUrl { get; set; }

    public string? ApiKey { get; set; }

    public required int ProjectId { get; set; }

    public required string KpiLabel { get; set; }

    public required string FormulaExpression { get; set; }

    public string Unit { get; set; } = "%";

    public int DecimalPlaces { get; set; } = 2;
}
