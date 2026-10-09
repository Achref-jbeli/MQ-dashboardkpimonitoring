using System.ComponentModel.DataAnnotations;

namespace DashboardKpi.Application.Dtos.Team;

public class UpdateTeamDto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    // Department
    public int DepartmentId { get; set; }

    // Team Leader
    public int TeamLeaderId { get; set; }
}