using System;

namespace DashboardKpi.Application.Dtos.Employee
{
    public class UpdateEmployeeDto
    {
        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public string? Email { get; set; }

        public string? Position { get; set; }

        public string? ProfessionalDomain { get; set; }

        public string? Seniority { get; set; }

        public string? Role { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? HireDate { get; set; }

        public DateTime? BirthDate { get; set; }

        public string? Department { get; set; }

        public int? DepartmentId { get; set; }

        public int? TeamId { get; set; }

        public string? Photo { get; set; }
    }
}