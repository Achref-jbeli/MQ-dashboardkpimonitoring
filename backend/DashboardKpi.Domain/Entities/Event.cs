using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DashboardKpi.Domain.Entities
{
    public class Event
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
        public string? Location { get; set; }
        public string? Type { get; set; }
        public string? ImageUrl { get; set; }

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }
        
        public int? EmployeeId { get; set; }
        public Employee? Employee { get; set; }
    }
}