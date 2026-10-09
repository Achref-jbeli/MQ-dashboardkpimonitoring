using System.ComponentModel.DataAnnotations;

namespace DashboardKpi.Domain.Entities;

public class Team
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }


    public Department Department { get; set; } = null!;
    public int DepartmentId { get; set; }

    public Employee? TeamLeader { get; set; }
    public int TeamLeaderId { get; set; }

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

}