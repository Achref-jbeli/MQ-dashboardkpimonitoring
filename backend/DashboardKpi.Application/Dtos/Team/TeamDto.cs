using System.ComponentModel.DataAnnotations;
using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Dtos.Department;

namespace DashboardKpi.Application.Dtos.Team;

public class TeamDto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    // Department
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public DepartmentDto? Department { get; set; }

    // Team Leader
    public int TeamLeaderId { get; set; }
    public string TeamLeaderName { get; set; } = string.Empty;
    public EmployeeDto? TeamLeader { get; set; }

    // Team Members
    public ICollection<EmployeeDto> Employees { get; set; } = new List<EmployeeDto>();
}