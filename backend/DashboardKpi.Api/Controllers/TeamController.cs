using Microsoft.AspNetCore.Mvc;
using DashboardKpi.Application.Dtos.Team;
using DashboardKpi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Api.Extensions;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/team")]
[Authorize(Roles = "TeamLeader,Administrator,SuperAdmin,Manager")]
public class TeamController : ControllerBase
{
    private readonly ITeamService _service;
    private readonly ApplicationDbContext _context;

    public TeamController(ITeamService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
    }

    private async Task<int?> ResolveDepartmentIdAsync(int? requestedDepartmentId = null)
    {
        var resolved = await User.ResolveDepartmentScopeAsync(_context, requestedDepartmentId);
        if (resolved.HasValue)
        {
            return resolved;
        }

        if (User.IsSuperAdmin() || User.IsInRole("Manager"))
        {
            if (requestedDepartmentId.HasValue)
            {
                return requestedDepartmentId;
            }

            var firstDept = await _context.Departments.Select(d => d.Id).FirstOrDefaultAsync();
            return firstDept > 0 ? firstDept : null;
        }

        return null;
    }

    // Team Leader gets his own team
    [Authorize(Roles = "TeamLeader,Administrator,SuperAdmin,Manager")]
    [HttpGet("my-team")]
    public async Task<IActionResult> GetMyTeam()
    {
        if (!User.TryGetEmployeeId(out var employeeId))
        {
            return Unauthorized();
        }

        var departmentId = await ResolveDepartmentIdAsync();
        var team = await _service.GetByLeaderIdAsync(employeeId, departmentId);

        if (team == null)
            return NotFound();

        return Ok(team);
    }

    // Admin and Manager get all teams (department scoped or global for SuperAdmin/Manager)
    [Authorize(Roles = "Administrator,SuperAdmin,Manager")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId);
        if (resolvedDepartmentId.HasValue)
        {
            return Ok(await _service.GetAllAsync(resolvedDepartmentId.Value));
        }

        if (User.IsSuperAdmin() || User.IsInRole("Manager"))
        {
            return Ok(await _service.GetAllAsync(null));
        }

        return BadRequest(new { message = "departmentId is required for this operation." });
    }

    // Get eligible team leaders for a department
    [Authorize(Roles = "Administrator,SuperAdmin,Manager")]
    [HttpGet("team-leaders")]
    public async Task<IActionResult> GetTeamLeaders([FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId);
        if (!resolvedDepartmentId.HasValue)
        {
            return BadRequest(new { message = "departmentId is required to fetch eligible team leaders." });
        }

        return Ok(await _service.GetTeamLeadersAsync(resolvedDepartmentId.Value));
    }

    // Create team
    [Authorize(Roles = "Administrator,SuperAdmin,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create(AddTeamDto dto, [FromQuery] int? departmentId)
    {
        var targetDeptId = dto.DepartmentId > 0 ? dto.DepartmentId : departmentId;
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(targetDeptId);
        if (!resolvedDepartmentId.HasValue)
        {
            return BadRequest(new { message = "A valid departmentId is required to create a team." });
        }

        try
        {
            var created = await _service.CreateAsync(dto, resolvedDepartmentId.Value);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Update team
    [Authorize(Roles = "Administrator,SuperAdmin,Manager")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateTeamDto dto,
        [FromQuery] int? departmentId)
    {
        var targetDeptId = dto.DepartmentId > 0 ? dto.DepartmentId : departmentId;
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(targetDeptId);

        try
        {
            var updated = await _service.UpdateAsync(id, dto, resolvedDepartmentId);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Delete team
    [Authorize(Roles = "Administrator,SuperAdmin,Manager")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId);
        var deleted = await _service.DeleteAsync(id, resolvedDepartmentId);

        if (!deleted)
            return NotFound();

        return NoContent();
    }

    // Employees available for adding to a team
    [Authorize(Roles = "Administrator,SuperAdmin,Manager")]
    [HttpGet("available-employees")]
    public async Task<IActionResult> GetAvailableEmployees([FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId);
        if (!resolvedDepartmentId.HasValue)
        {
            return BadRequest(new { message = "departmentId is required for this operation." });
        }

        var employees = await _service.GetAvailableEmployeesAsync(resolvedDepartmentId.Value);
        return Ok(employees);
    }

    // Assign employees to team
    [Authorize(Roles = "Administrator,SuperAdmin,Manager")]
    [HttpPost("{teamId:int}/members")]
    public async Task<IActionResult> AssignMembers(
        int teamId,
        AssignMembersDto dto,
        [FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId);
        if (!resolvedDepartmentId.HasValue)
        {
            return BadRequest(new { message = "departmentId is required for this operation." });
        }

        await _service.AssignMembersAsync(teamId, dto, resolvedDepartmentId.Value);
        return NoContent();
    }
}