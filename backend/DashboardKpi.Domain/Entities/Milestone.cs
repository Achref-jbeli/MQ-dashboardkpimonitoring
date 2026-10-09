using System;

namespace DashboardKpi.Domain.Entities
{
    public class Milestone
    {
        public int Id { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int DepartmentId { get; set; }
        public Department? Department { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime? PlannedDate { get; set; }

        public DateTime? ActualDate { get; set; }

        public string Status { get; set; } = "Open"; // Open, In Progress, Completed, Delayed

        public string? Responsible { get; set; }

        public int? DelayDays { get; set; }

        public string Source { get; set; } = "Manual"; // Manual, Jira, Excel

        public string? SourceIdentifier { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
