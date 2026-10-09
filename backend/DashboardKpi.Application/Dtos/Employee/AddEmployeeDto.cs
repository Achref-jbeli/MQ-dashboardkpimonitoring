using System;
using System.ComponentModel.DataAnnotations;

namespace DashboardKpi.Application.Dtos.Employee
{
    public class AddEmployeeDto
    {
        [Required(ErrorMessage = "First name is required.")]
        public required string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required.")]
        public required string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email address is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public required string Email { get; set; } = string.Empty;

        public string? Position { get; set; }

        public string? ProfessionalDomain { get; set; }

        public string? Seniority { get; set; }

        public string Role { get; set; } = "Employee";

        public bool IsActive { get; set; } = true;

        public DateTime? HireDate { get; set; }

        public DateTime? BirthDate { get; set; }

        public string? Department { get; set; }

        [Required(ErrorMessage = "Department is required.")]
        public int? DepartmentId { get; set; }

        public int? TeamId { get; set; }

        public string? Photo { get; set; }

        public string? Password { get; set; }
    }
}