using DashboardKpi.Application.Dtos.Task;

namespace DashboardKpi.Application.Interfaces;

public interface ITaskService
{
    Task<IReadOnlyList<TaskDto>> GetMyTeamTasksAsync(int teamLeaderId, int departmentId, string? departmentName, int? year, int? month);

    Task<IReadOnlyList<TaskDto>> GetDepartmentTasksAsync(int departmentId, string? departmentName, int? year, int? month);

    Task<TaskDto> CreateTaskAsync(int creatorId, int departmentId, AddTaskDto dto);

    Task<TaskDto> UpdateTaskAsync(int taskId, int departmentId, UpdateTaskDto dto);

    Task DeleteTaskAsync(int taskId, int departmentId);
}