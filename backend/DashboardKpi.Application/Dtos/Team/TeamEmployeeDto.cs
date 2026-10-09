using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DashboardKpi.Application.Dtos.Department;



namespace DashboardKpi.Application.Dtos.Team
{
    public class TeamEmployeeDto
    {
        public int Id { get; set; }

        public required string FirstName { get; set; } = string.Empty;

        public required string LastName {get; set;} = string.Empty;

        public string? Email { get; set; }

        public string? Position { get; set; }

        public DepartmentDto? Department { get; set; }

        public string? ProfessionalDomain { get; set; }

        public string? Seniority { get; set; }

        public bool IsActive { get; set; }

        public DateTime? BirthDate { get; set; }

        public string? Photo { get; set; }


    }
}