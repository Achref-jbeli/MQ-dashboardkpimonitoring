namespace DashboardKpi.Application.Dtos.Employee;

public class TeamLeaderOptionDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ProfessionalDomain { get; set; }
    public string? Position { get; set; }

    public bool IsAssigned { get; set; }
    public int? AssignedTeamId { get; set; }
    public string? AssignedTeamName { get; set; }
}