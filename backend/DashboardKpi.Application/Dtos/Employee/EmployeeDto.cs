using System;
using System.Collections.Generic;
using DashboardKpi.Application.Dtos.Department;

namespace DashboardKpi.Application.Dtos.Employee
{
    public class EmployeeDto
    {
        public int Id { get; set; }

        public required string FirstName { get; set; } = string.Empty;

        public required string LastName { get; set; } = string.Empty;

        public string? Email { get; set; }

        public string? Position { get; set; }

        public int? DepartmentId { get; set; }

        public string? DepartmentName { get; set; }

        public DepartmentDto? Department { get; set; }

        public string? Role { get; set; }

        public int? TeamId { get; set; }

        public string? TeamName { get; set; }

        public string? ProfessionalDomain { get; set; }

        public string? Seniority { get; set; }

        public bool IsActive { get; set; }

        public DateTime? HireDate { get; set; }

        public DateTime? BirthDate { get; set; }

        public string? Photo { get; set; }
    }
}