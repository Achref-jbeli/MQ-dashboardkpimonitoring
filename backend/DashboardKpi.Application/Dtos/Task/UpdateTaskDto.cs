namespace DashboardKpi.Application.Dtos.Task;

public class UpdateTaskDto
{
    public string? Title { get; set; }

    public string? Description { get; set; }

    public string? Status { get; set; }

    public int? Progress { get; set; }

    public int? AssigneeId { get; set; }

    public int? ProjectId { get; set; }

    public string? Note { get; set; }

    public DateTime? DueDate { get; set; }
}
