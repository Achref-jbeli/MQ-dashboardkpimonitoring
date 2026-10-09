namespace DashboardKpi.Application.Dtos.Task;

public class TaskDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Status { get; set; } = string.Empty;

    public int Progress { get; set; }

    public int PerformanceScore { get; set; }

    public int DepartmentId { get; set; }

    public int? TeamId { get; set; }

    public int? ProjectId { get; set; }

    public int? AssigneeId { get; set; }

    public string? AssigneeName { get; set; }

    public int? TeamLeaderId { get; set; }

    public string? ResponsibleName { get; set; }

    public string? ResponsibleDepartment { get; set; }

    public string? BusinessUnit { get; set; }

    public string? WorkItem { get; set; }

    public string? Function { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedOn { get; set; }

    public DateTime? SendDate { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }
}