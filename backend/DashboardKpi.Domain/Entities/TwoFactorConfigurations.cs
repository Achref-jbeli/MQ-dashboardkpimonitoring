namespace DashboardKpi.Domain.Entities;

public class TwoFactorConfigurations
{
    public int Id {get;set;}

    public int EmployeeId {get;set;}

    public Employee Employee {get;set;} = null!;


    public bool Enabled {get;set;}


    public string Provider {get;set;} = "";


    public string? SecretKey {get;set;}


    public DateTime CreatedAt {get;set;} = DateTime.UtcNow;
}