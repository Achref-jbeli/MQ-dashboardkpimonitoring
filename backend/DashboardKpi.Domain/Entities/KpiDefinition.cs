namespace DashboardKpi.Domain.Entities;

public class KpiDefinition
{
    public int Id { get; set; }

    public int? DepartmentId { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string FormulaExpression { get; set; } = string.Empty;

    public string Unit { get; set; } = "%";

    public int DecimalPlaces { get; set; } = 2;

    public decimal GreenThreshold { get; set; } = 80m;

    public decimal YellowThreshold { get; set; } = 60m;

    public decimal OrangeThreshold { get; set; } = 40m;

    public decimal RedThreshold { get; set; } = 0m;

    public bool IsActive { get; set; } = true;

    public int Version { get; set; } = 1;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public Department? Department { get; set; }
}
