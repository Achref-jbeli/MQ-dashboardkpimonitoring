namespace DashboardKpi.Application.Dtos.Project
{
    public class ProjectBusinessUnitDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ProjectDto
    {
        public int Id { get; set; }
        public string? ApiKey { get; set; }
        public string? Title { get; set; }

        public int? BusinessUnitId { get; set; }
        public ProjectBusinessUnitDto? BusinessUnit { get; set; }

        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int? DepartmentId { get; set; }

        public int? TeamLeaderId { get; set; }
        public string? TeamLeaderName { get; set; }
    }
}
