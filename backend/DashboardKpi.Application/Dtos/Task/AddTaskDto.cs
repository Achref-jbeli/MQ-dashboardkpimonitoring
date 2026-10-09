namespace DashboardKpi.Application.Dtos.Task;

public class AddTaskDto
{
    public required string Title { get; set; }

    public string? Description { get; set; }

    public int AssigneeId { get; set; }

    public int? ProjectId { get; set; }

    public string? BusinessUnit { get; set; }

    public string? WorkItem { get; set; }

    public string? Function { get; set; }

    public string? Note { get; set; }

    public DateTime? DueDate { get; set; }
}