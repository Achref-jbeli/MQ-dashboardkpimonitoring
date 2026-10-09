namespace DashboardKpi.Domain.Entities;

public class TaskItem
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ChangeNumber { get; set; }

    public string? ReasonForChange { get; set; }

    public string? BusinessUnit { get; set; }

    public string? MecType { get; set; }

    public string? Plant { get; set; }

    public string? WbsElement { get; set; }

    public string? WorkItem { get; set; }

    public string? Function { get; set; }

    public string? Note { get; set; }

    public string? SourceMonth { get; set; }

    public string Status { get; set; } = "Open";

    public int Progress { get; set; }

    public int PerformanceScore { get; set; }

    public string? ResponsibleName { get; set; }

    public string? ResponsibleDepartment { get; set; }

    public string? CreatedBy { get; set; }

    public string? AssigneeName { get; set; }

    public DateTime? CreatedOn { get; set; }

    public DateTime? SendDate { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? InitialDate { get; set; }

    public DateTime? ForwardedDate { get; set; }

    public int? Days { get; set; }

    public int DepartmentId { get; set; }

    public Department Department { get; set; } = null!;

    public int? TeamId { get; set; }

    public Team? Team { get; set; }

    public int? ProjectId { get; set; }

    public Project? Project { get; set; }

    public int? AssigneeId { get; set; }

    public Employee? Assignee { get; set; }

    public int? TeamLeaderId { get; set; }

    public Employee? TeamLeader { get; set; }
}