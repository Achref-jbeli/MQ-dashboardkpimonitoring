using DashboardKpi.Application.Dtos.Task;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly ApplicationDbContext _context;

    public TaskService(ApplicationDbContext context)
    {
        _context = context;
    }

    // ── TeamLeader scope (existing) ──────────────────────────────────────────

    public async Task<IReadOnlyList<TaskDto>> GetMyTeamTasksAsync(
        int teamLeaderId, int departmentId, string? departmentName, int? year, int? month)
    {
        var query = _context.Set<TaskItem>()
            .AsNoTracking()
            .Where(t =>
                (t.DepartmentId == departmentId ||
                 (t.DepartmentId == 0 && departmentName != null && t.ResponsibleDepartment == departmentName))
                && t.TeamLeaderId == teamLeaderId);

        query = ApplyDateFilter(query, year, month);

        return await query
            .OrderByDescending(t => t.CreatedOn ?? t.SendDate)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TaskDto>> GetDepartmentTasksAsync(
        int departmentId, string? departmentName, int? year, int? month)
    {
        var query = _context.Set<TaskItem>()
            .AsNoTracking()
            .Where(t =>
                t.DepartmentId == departmentId ||
                (t.DepartmentId == 0 && departmentName != null && t.ResponsibleDepartment == departmentName));

        query = ApplyDateFilter(query, year, month);

        return await query
            .OrderByDescending(t => t.CreatedOn ?? t.SendDate ?? t.DueDate)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    private static IQueryable<TaskItem> ApplyDateFilter(IQueryable<TaskItem> query, int? year, int? month)
    {
        if (year.HasValue && year.Value > 0)
        {
            query = query.Where(t =>
                (t.SendDate.HasValue && t.SendDate.Value.Year == year.Value) ||
                (t.SendDate == null && t.CreatedOn.HasValue && t.CreatedOn.Value.Year == year.Value) ||
                (t.SendDate == null && t.CreatedOn == null && t.DueDate.HasValue && t.DueDate.Value.Year == year.Value));
        }
        if (month.HasValue && month.Value > 0)
        {
            query = query.Where(t =>
                (t.SendDate.HasValue && t.SendDate.Value.Month == month.Value) ||
                (t.SendDate == null && t.CreatedOn.HasValue && t.CreatedOn.Value.Month == month.Value) ||
                (t.SendDate == null && t.CreatedOn == null && t.DueDate.HasValue && t.DueDate.Value.Month == month.Value));
        }
        return query;
    }

    public async Task<TaskDto> CreateTaskAsync(int creatorId, int departmentId, AddTaskDto dto)
    {
        // Verify assignee belongs to this department
        var assignee = await _context.Employees
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == dto.AssigneeId && e.DepartmentId == departmentId);

        if (assignee == null)
            throw new InvalidOperationException("Assignee must belong to this department.");

        if (dto.ProjectId.HasValue)
        {
            var exists = await _context.Projects.AnyAsync(p =>
                p.Id == dto.ProjectId.Value && p.DepartmentId == departmentId);
            if (!exists)
                throw new InvalidOperationException("Project was not found in your department.");
        }

        var deptName = await _context.Departments
            .Where(d => d.Id == departmentId)
            .Select(d => d.Name)
            .FirstOrDefaultAsync();

        var now = DateTime.UtcNow;
        var entity = new TaskItem
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            DepartmentId = departmentId,
            ProjectId = dto.ProjectId,
            AssigneeId = assignee.Id,
            AssigneeName = $"{assignee.FirstName} {assignee.LastName}".Trim(),
            ResponsibleDepartment = deptName,
            BusinessUnit = dto.BusinessUnit,
            WorkItem = dto.WorkItem,
            Function = dto.Function,
            Note = dto.Note,
            CreatedOn = now,
            SendDate = now,
            DueDate = dto.DueDate,
            Status = "On Hold",
            Progress = 0,
            PerformanceScore = 0,
            SourceMonth = now.ToString("yyyy-MM")
        };

        _context.Set<TaskItem>().Add(entity);
        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<TaskDto> UpdateTaskAsync(int taskId, int departmentId, UpdateTaskDto dto)
    {
        var task = await _context.Set<TaskItem>()
            .FirstOrDefaultAsync(t => t.Id == taskId && t.DepartmentId == departmentId)
            ?? throw new InvalidOperationException("Task not found.");

        if (dto.Title != null) task.Title = dto.Title.Trim();
        if (dto.Description != null) task.Description = dto.Description.Trim();
        if (dto.Note != null) task.Note = dto.Note.Trim();
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate;
        if (dto.Progress.HasValue) task.Progress = dto.Progress.Value;

        if (dto.Status != null)
        {
            task.Status = dto.Status;
            if (dto.Status == "Completed" && task.CompletedAt == null)
                task.CompletedAt = DateTime.UtcNow;
            else if (dto.Status != "Completed")
                task.CompletedAt = null;
        }

        if (dto.AssigneeId.HasValue)
        {
            var assignee = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == dto.AssigneeId.Value && e.DepartmentId == departmentId)
                ?? throw new InvalidOperationException("Assignee must belong to this department.");

            task.AssigneeId = assignee.Id;
            task.AssigneeName = $"{assignee.FirstName} {assignee.LastName}".Trim();
        }

        if (dto.ProjectId.HasValue)
        {
            if (dto.ProjectId.Value == 0)
            {
                task.ProjectId = null; // explicit clear
            }
            else
            {
                var exists = await _context.Projects.AnyAsync(p =>
                    p.Id == dto.ProjectId.Value && p.DepartmentId == departmentId);
                if (!exists) throw new InvalidOperationException("Project not found in department.");
                task.ProjectId = dto.ProjectId.Value;
            }
        }

        await _context.SaveChangesAsync();
        return MapToDto(task);
    }

    public async Task DeleteTaskAsync(int taskId, int departmentId)
    {
        var task = await _context.Set<TaskItem>()
            .FirstOrDefaultAsync(t => t.Id == taskId && t.DepartmentId == departmentId)
            ?? throw new InvalidOperationException("Task not found.");

        _context.Set<TaskItem>().Remove(task);
        await _context.SaveChangesAsync();
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private static TaskDto MapToDto(TaskItem task) => new()
    {
        Id = task.Id,
        Title = task.Title,
        Description = task.Description,
        Status = task.Status,
        Progress = task.Progress,
        PerformanceScore = task.PerformanceScore,
        DepartmentId = task.DepartmentId,
        TeamId = task.TeamId,
        ProjectId = task.ProjectId,
        AssigneeId = task.AssigneeId,
        AssigneeName = task.AssigneeName,
        TeamLeaderId = task.TeamLeaderId,
        ResponsibleName = task.ResponsibleName,
        ResponsibleDepartment = task.ResponsibleDepartment,
        BusinessUnit = task.BusinessUnit,
        WorkItem = task.WorkItem,
        Function = task.Function,
        Note = task.Note,
        CreatedOn = task.CreatedOn,
        SendDate = task.SendDate,
        DueDate = task.DueDate,
        CompletedAt = task.CompletedAt,
    };
}