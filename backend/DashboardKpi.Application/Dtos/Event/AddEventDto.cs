using System;

namespace DashboardKpi.Application.Dtos.Event
{
    public class AddEventDto
    {
        public required string Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Date { get; set; }
        public string? Location { get; set; }
        public string? Type { get; set; }
        public string? ImageUrl { get; set; }
        public int? DepartmentId { get; set; }
        public int? EmployeeId { get; set; }
    }
}