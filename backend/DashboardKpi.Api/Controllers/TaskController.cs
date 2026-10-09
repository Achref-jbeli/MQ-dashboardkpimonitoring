using DashboardKpi.Api.Extensions;
using DashboardKpi.Application.Dtos.Task;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize(Roles = "TeamLeader,Manager,Administrator,SuperAdmin")]
public class TaskController : ControllerBase
{
    private readonly ITaskService _service;
    private readonly ApplicationDbContext _context;

    public TaskController(ITaskService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
    }

    private async Task<int?> ResolveDepartmentIdAsync()
        => await User.GetCurrentDepartmentIdAsync(_context);

    private async Task<string?> ResolveDepartmentNameAsync(int departmentId)
        => await _context.Departments
            .Where(d => d.Id == departmentId)
            .Select(d => d.Name)
            .FirstOrDefaultAsync();

    // ── TeamLeader: own-team tasks ───────────────────────────────────────────

    [HttpGet("my-team")]
    public async Task<IActionResult> GetMyTeamTasks([FromQuery] int? year, [FromQuery] int? month)
    {
        if (!User.TryGetEmployeeId(out var employeeId)) return Unauthorized();
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue) return Forbid();

        var deptName = await ResolveDepartmentNameAsync(departmentId.Value);
        var tasks = await _service.GetMyTeamTasksAsync(employeeId, departmentId.Value, deptName, year, month);
        return Ok(tasks);
    }

    // ── Admin/Manager: all tasks in department ───────────────────────────────

    [HttpGet("department")]
    [Authorize(Roles = "Manager,Administrator,SuperAdmin")]
    public async Task<IActionResult> GetDepartmentTasks(
        [FromQuery] int? departmentId,
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        var scopedDeptId = await User.ResolveDepartmentScopeAsync(_context, departmentId);
        if (!scopedDeptId.HasValue)
        {
            var firstDept = await _context.Departments.OrderBy(d => d.Id).FirstOrDefaultAsync();
            scopedDeptId = firstDept?.Id;
        }

        if (!scopedDeptId.HasValue) return Forbid();

        var deptName = await ResolveDepartmentNameAsync(scopedDeptId.Value);
        var tasks = await _service.GetDepartmentTasksAsync(scopedDeptId.Value, deptName, year, month);
        return Ok(tasks);
    }

    // ── Create ───────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] AddTaskDto dto)
    {
        if (!User.TryGetEmployeeId(out var employeeId)) return Unauthorized();
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue) return Forbid();

        try
        {
            var created = await _service.CreateTaskAsync(employeeId, departmentId.Value, dto);
            return Ok(created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Update ───────────────────────────────────────────────────────────────

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager,Administrator,SuperAdmin")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue) return Forbid();

        try
        {
            var updated = await _service.UpdateTaskAsync(id, departmentId.Value, dto);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Manager,Administrator,SuperAdmin")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue) return Forbid();

        try
        {
            await _service.DeleteTaskAsync(id, departmentId.Value);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}