using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DashboardKpi.Application.Dtos.Project;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Api.Extensions;
 


namespace DashboardKpi.Api.Controllers
{
    [Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : Controller
    {
        private readonly ApplicationDbContext dbcontext;

        public ProjectController(ApplicationDbContext dbcontext)
        {
            this.dbcontext = dbcontext;
        }

        private async Task<int?> ResolveDepartmentIdAsync(int? requestedDepartmentId = null, bool allowGlobalForSuperAdmin = false)
        {
            if (allowGlobalForSuperAdmin && User.IsSuperAdmin() && !requestedDepartmentId.HasValue)
            {
                return null;
            }

            return await User.ResolveDepartmentScopeAsync(dbcontext, requestedDepartmentId);
        }

        private static ProjectDto MapToDto(Project project) => new()
        {
            Id = project.Id,
            ApiKey = project.ApiKey,
            Title = project.Title,
            BusinessUnitId = project.BusinessUnitId,
            BusinessUnit = project.BusinessUnit != null
                ? new ProjectBusinessUnitDto { Id = project.BusinessUnit.Id, Name = project.BusinessUnit.Name }
                : null,
            Status = project.Status,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            DepartmentId = project.DepartmentId,
            TeamLeaderId = project.TeamLeaderId,
            TeamLeaderName = project.TeamLeader != null ? $"{project.TeamLeader.FirstName} {project.TeamLeader.LastName}" : null,
        };

        // TeamLeaders only see projects assigned to them; other roles keep full department scope.
        private bool IsTeamLeaderOnly() => User.IsInRole("TeamLeader") && !User.IsInRole("Administrator") && !User.IsInRole("SuperAdmin") && !User.IsInRole("Manager");

        [HttpGet]
        public async Task<IActionResult> GetProjects([FromQuery] int? departmentId)
        {
            var resolvedDepartmentId =
                await ResolveDepartmentIdAsync(
                    departmentId,
                    allowGlobalForSuperAdmin: true);

            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Projects
                .Include(p => p.BusinessUnit)
                .Include(p => p.TeamLeader)
                .AsQueryable();

            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(project =>
                    project.DepartmentId == resolvedDepartmentId.Value ||
                    project.Tasks.Any(t =>
                        t.DepartmentId == resolvedDepartmentId.Value));
            }

            if (IsTeamLeaderOnly() && User.TryGetEmployeeId(out var teamLeaderEmployeeId))
            {
                query = query.Where(project => project.TeamLeaderId == teamLeaderEmployeeId);
            }

            var projects = await query.ToListAsync();

            return Ok(projects.Select(MapToDto).ToList());
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProjectById(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Projects
                .Include(p => p.BusinessUnit)
                .Include(p => p.TeamLeader)
                .Where(e => e.Id == id);
            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(e => e.DepartmentId == resolvedDepartmentId.Value || e.Tasks.Any(t => t.DepartmentId == resolvedDepartmentId.Value));
            }

            var project = await query.FirstOrDefaultAsync();
            if(project == null)
                return NotFound();

            if (IsTeamLeaderOnly() && User.TryGetEmployeeId(out var teamLeaderEmployeeId) && project.TeamLeaderId != teamLeaderEmployeeId)
            {
                return Forbid();
            }

            return Ok(MapToDto(project));

        }

    [HttpPost]
public async Task<IActionResult> CreateProject(
    [FromBody] AddProjectDto addProjectDto,
    [FromQuery] int? departmentId)
{
    var resolvedDepartmentId =
        await ResolveDepartmentIdAsync(departmentId);

    if (!resolvedDepartmentId.HasValue)
    {
        return Forbid();
    }

    if (!addProjectDto.BusinessUnitId.HasValue)
    {
        return BadRequest(new
        {
            message = "BusinessUnitId is required."
        });
    }

    var businessUnit = await dbcontext.BusinessUnits
        .FirstOrDefaultAsync(bu =>
            bu.Id == addProjectDto.BusinessUnitId.Value);

    if (businessUnit == null)
    {
        return BadRequest(new
        {
            message =
                $"Business unit with ID {addProjectDto.BusinessUnitId.Value} was not found."
        });
    }

    var projectEntity = new Project
    {
        ApiKey = addProjectDto.ApiKey,
        Title = addProjectDto.Title,
        BusinessUnitId = businessUnit.Id,
        Status = addProjectDto.Status,
        StartDate = addProjectDto.StartDate,
        EndDate = addProjectDto.EndDate,
        DepartmentId = resolvedDepartmentId.Value
    };

    dbcontext.Projects.Add(projectEntity);

    await dbcontext.SaveChangesAsync();

    projectEntity.BusinessUnit = businessUnit;

    return Ok(MapToDto(projectEntity));
}



[HttpPut("{id}")]
public async Task<IActionResult> UpdateProject(
    int id,
    UpdateProjectDto updateProjectDto,
    [FromQuery] int? departmentId)
{
    var sourceDepartmentId =
        await ResolveDepartmentIdAsync(
            departmentId,
            allowGlobalForSuperAdmin: true);

    if (!sourceDepartmentId.HasValue && !User.IsSuperAdmin())
    {
        return Forbid();
    }

    var query = dbcontext.Projects
        .Where(item => item.Id == id);

    if (sourceDepartmentId.HasValue)
    {
        query = query.Where(item =>
            item.DepartmentId == sourceDepartmentId.Value ||
            item.DepartmentId == null);
    }

    var project = await query.FirstOrDefaultAsync();

    if (project == null)
    {
        return NotFound();
    }

    if (IsTeamLeaderOnly() && User.TryGetEmployeeId(out var updaterEmployeeId) && project.TeamLeaderId != updaterEmployeeId)
    {
        return Forbid();
    }

    var resolvedTargetDepartmentId =
        await ResolveDepartmentIdAsync(
            updateProjectDto.DepartmentId ??
            departmentId ??
            project.DepartmentId);

    if (!resolvedTargetDepartmentId.HasValue)
    {
        return BadRequest(new
        {
            message = "DepartmentId is required."
        });
    }

    if (updateProjectDto.ApiKey != null)
    {
        project.ApiKey = updateProjectDto.ApiKey;
    }

    if (updateProjectDto.Title != null)
    {
        project.Title = updateProjectDto.Title;
    }

    // Update Business Unit
    if (updateProjectDto.BusinessUnitId.HasValue)
    {
        var businessUnit = await dbcontext.BusinessUnits
            .FirstOrDefaultAsync(bu =>
                bu.Id == updateProjectDto.BusinessUnitId.Value);

        if (businessUnit == null)
        {
            return BadRequest(new
            {
                message =
                    $"Business unit with ID {updateProjectDto.BusinessUnitId.Value} was not found."
            });
        }

        project.BusinessUnitId = businessUnit.Id;
    }

    if (updateProjectDto.Status != null)
    {
        project.Status = updateProjectDto.Status;
    }

    if (updateProjectDto.StartDate.HasValue)
    {
        project.StartDate = updateProjectDto.StartDate;
    }

    if (updateProjectDto.EndDate.HasValue)
    {
        project.EndDate = updateProjectDto.EndDate;
    }

    project.DepartmentId = resolvedTargetDepartmentId.Value;

    await dbcontext.SaveChangesAsync();

    var reloaded = await dbcontext.Projects
        .Include(p => p.BusinessUnit)
        .Include(p => p.TeamLeader)
        .FirstOrDefaultAsync(p => p.Id == project.Id);

    return Ok(MapToDto(reloaded ?? project));
}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Projects.Where(item => item.Id == id);
            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == resolvedDepartmentId.Value);
            }

            var project = await query.FirstOrDefaultAsync();
            if (project == null)
            {
                return NotFound();
            }

            if (IsTeamLeaderOnly() && User.TryGetEmployeeId(out var deleterEmployeeId) && project.TeamLeaderId != deleterEmployeeId)
            {
                return Forbid();
            }

            dbcontext.Projects.Remove(project);
            await dbcontext.SaveChangesAsync();
            return NoContent();
        }

        // Admin/SuperAdmin only: assign (or unassign) the Team Leader who manages this project.
        [Authorize(Roles = "Administrator,SuperAdmin")]
        [HttpPut("{id}/team-leader")]
        public async Task<IActionResult> AssignTeamLeader(int id, [FromBody] AssignProjectTeamLeaderDto dto, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Projects.Where(item => item.Id == id);
            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == resolvedDepartmentId.Value);
            }

            var project = await query.Include(p => p.BusinessUnit).FirstOrDefaultAsync();
            if (project == null)
            {
                return NotFound();
            }

            if (dto.TeamLeaderId.HasValue)
            {
                var teamLeader = await dbcontext.Employees
                    .FirstOrDefaultAsync(e => e.Id == dto.TeamLeaderId.Value);

                if (teamLeader == null || !string.Equals(teamLeader.Role, "TeamLeader", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Selected employee is not a Team Leader." });
                }

                if (teamLeader.DepartmentId == null || teamLeader.DepartmentId != project.DepartmentId)
                {
                    return BadRequest(new { message = "Team Leader must belong to the same department as the project." });
                }

                project.TeamLeaderId = teamLeader.Id;
                project.TeamLeader = teamLeader;
            }
            else
            {
                project.TeamLeaderId = null;
                project.TeamLeader = null;
            }

            await dbcontext.SaveChangesAsync();

            return Ok(MapToDto(project));
        }
    }


}