namespace DashboardKpi.Application.Dtos.Kpi;

public class MonthlyAdherenceDto
{
    public string Month { get; set; } = string.Empty;

    // Traffic-light item counts
    public int GreenCount { get; set; }
    public int YellowCount { get; set; }
    public int OrangeCount { get; set; }
    public int RedCount { get; set; }
    public int TotalCount { get; set; }

    // 100% Stacked percentages (sum to 100%)
    public decimal GreenPercentage { get; set; }
    public decimal YellowPercentage { get; set; }
    public decimal OrangePercentage { get; set; }
    public decimal RedPercentage { get; set; }

    // Adherence = Green + Yellow
    public decimal AdherencePercentage { get; set; }
    public int AdherenceCount { get; set; }

    // Aliases for compatibility
    public int Green => GreenCount;
    public int Yellow => YellowCount;
    public int Orange => OrangeCount;
    public int Red => RedCount;
    public int Adherence => AdherenceCount;
    public int Total => TotalCount;
}
