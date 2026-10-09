namespace DashboardKpi.Domain.Entities;
public class Employee
{
    public int Id { get; set; }
    public required string FirstName { get; set; }

    public required string LastName {get; set;}

    public string? Email {get; set;}

    public string? PasswordHash {get; set;}

    public string? ProfessionalDomain {get; set;}

    public string? Seniority {get; set;}

    public DateTime? BirthDate{get; set;}

    public required bool IsActive {get; set;}

    public string? Position { get; set; }

    public DateTime? HireDate { get; set; }

    public string? Department { get; set; }

    public int? DepartmentId { get; set; }

    public Department? DepartmentEntity { get; set; }


    public string? Photo {get; set;}

    public string? Role { get; set; }

    public bool IsAccountApproved { get; set; }

    public bool TwoFactorEnabled { get; set; }

    public string? TwoFactorProvider { get; set; }
    
    public string? GoogleAuthenticatorSecret { get; set; }
    
    public Team? Team { get; set; }
    
    public int? TeamId { get; set; }

    public ICollection<TaskItem> AssignedTasks { get; set; }
    = new List<TaskItem>();

    public ICollection<TaskItem> ResponsibleTasks { get; set; }
    = new List<TaskItem>();
}