namespace DashboardKpi.Domain.Entities
{
    public class ExternalApi
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? BaseUrl { get; set; }

        public string? ApiKey { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public DateTime? LastSyncedAtUtc { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int DepartmentId { get; set; }
        public Department? Department { get; set; }
    }
}