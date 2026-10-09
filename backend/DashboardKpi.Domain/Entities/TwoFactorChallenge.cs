namespace DashboardKpi.Domain.Entities;

public class TwoFactorChallenge
{
    public int Id { get; set; }


    public int EmployeeId { get; set; }


    public string Code { get; set; } = string.Empty;


    public DateTime Expiration { get; set; }


    public bool Used { get; set; }

    public string codeHash { get; set; } = string.Empty;

    public Employee Employee { get; set; } = null!;
}