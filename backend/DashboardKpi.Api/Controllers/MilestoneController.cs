using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DashboardKpi.Application.Dtos.Milestone;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DashboardKpi.Api.Extensions;

namespace DashboardKpi.Api.Controllers
{
    [Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class MilestoneController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MilestoneController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<MilestoneDto>>> GetMilestones(
            [FromQuery] int? departmentId = null,
            [FromQuery] int? projectId = null)
        {
            var query = _context.Milestones
                .AsNoTracking()
                .Include(m => m.Project)
                .Include(m => m.Department)
                .AsQueryable();

            // Only filter by department when explicitly requested
            if (departmentId.HasValue)
            {
                query = query.Where(m => m.DepartmentId == departmentId.Value);
            }

            if (projectId.HasValue)
            {
                query = query.Where(m => m.ProjectId == projectId.Value);
            }

            var milestones = await query
                .OrderBy(m => m.PlannedDate)
                .ThenBy(m => m.Name)
                .Select(m => new MilestoneDto
                {
                    Id = m.Id,
                    ProjectId = m.ProjectId,
                    ProjectTitle = m.Project != null ? m.Project.Title : null,
                    DepartmentId = m.DepartmentId,
                    DepartmentName = m.Department != null ? m.Department.Name : null,
                    Name = m.Name,
                    Description = m.Description,
                    PlannedDate = m.PlannedDate,
                    ActualDate = m.ActualDate,
                    Status = m.Status,
                    Responsible = m.Responsible,
                    DelayDays = m.DelayDays,
                    Source = m.Source,
                    SourceIdentifier = m.SourceIdentifier,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt
                })
                .ToListAsync();

            return Ok(milestones);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<MilestoneDto>> GetMilestone(int id)
        {
            var m = await _context.Milestones
                .AsNoTracking()
                .Include(m => m.Project)
                .Include(m => m.Department)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (m == null)
            {
                return NotFound(new { message = "Milestone not found." });
            }

            return Ok(new MilestoneDto
            {
                Id = m.Id,
                ProjectId = m.ProjectId,
                ProjectTitle = m.Project != null ? m.Project.Title : null,
                DepartmentId = m.DepartmentId,
                DepartmentName = m.Department != null ? m.Department.Name : null,
                Name = m.Name,
                Description = m.Description,
                PlannedDate = m.PlannedDate,
                ActualDate = m.ActualDate,
                Status = m.Status,
                Responsible = m.Responsible,
                DelayDays = m.DelayDays,
                Source = m.Source,
                SourceIdentifier = m.SourceIdentifier,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<MilestoneDto>> CreateMilestone([FromBody] CreateMilestoneDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Milestone Name is required." });
            }

            var resolvedDeptId = await User.ResolveDepartmentScopeAsync(_context, dto.DepartmentId > 0 ? dto.DepartmentId : null);
            var effectiveDeptId = resolvedDeptId ?? dto.DepartmentId;

            // Department validation
            var departmentExists = await _context.Departments.AnyAsync(d => d.Id == effectiveDeptId);
            if (!departmentExists)
            {
                return BadRequest(new { message = "Invalid DepartmentId." });
            }

            // Project validation - must belong to the department
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == dto.ProjectId && (p.DepartmentId == effectiveDeptId || p.Tasks.Any(t => t.DepartmentId == effectiveDeptId)));

            if (project == null)
            {
                return BadRequest(new { message = "Project not found or does not belong to the specified department." });
            }

            int? delayDays = null;
            if (dto.ActualDate.HasValue && dto.PlannedDate.HasValue)
            {
                delayDays = (int)Math.Max(0, (dto.ActualDate.Value.Date - dto.PlannedDate.Value.Date).TotalDays);
            }

            var milestone = new Milestone
            {
                ProjectId = dto.ProjectId,
                DepartmentId = effectiveDeptId,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                PlannedDate = dto.PlannedDate,
                ActualDate = dto.ActualDate,
                Status = dto.Status ?? "Open",
                Responsible = dto.Responsible?.Trim(),
                DelayDays = delayDays,
                Source = "Manual",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMilestone), new { id = milestone.Id }, new MilestoneDto
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                ProjectTitle = project.Title,
                DepartmentId = milestone.DepartmentId,
                Name = milestone.Name,
                Description = milestone.Description,
                PlannedDate = milestone.PlannedDate,
                ActualDate = milestone.ActualDate,
                Status = milestone.Status,
                Responsible = milestone.Responsible,
                DelayDays = milestone.DelayDays,
                Source = milestone.Source,
                CreatedAt = milestone.CreatedAt,
                UpdatedAt = milestone.UpdatedAt
            });
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<MilestoneDto>> UpdateMilestone(int id, [FromBody] UpdateMilestoneDto dto)
        {
            var milestone = await _context.Milestones
                .Include(m => m.Project)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (milestone == null)
            {
                return NotFound(new { message = "Milestone not found." });
            }

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                milestone.Name = dto.Name.Trim();
            }

            if (dto.ProjectId.HasValue && dto.ProjectId.Value != milestone.ProjectId)
            {
                var project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.Id == dto.ProjectId.Value && (p.DepartmentId == milestone.DepartmentId || p.Tasks.Any(t => t.DepartmentId == milestone.DepartmentId)));

                if (project == null)
                {
                    return BadRequest(new { message = "Project not found or does not belong to the department." });
                }

                milestone.ProjectId = dto.ProjectId.Value;
            }

            milestone.Description = dto.Description?.Trim();
            milestone.PlannedDate = dto.PlannedDate;
            milestone.ActualDate = dto.ActualDate;
            milestone.Status = dto.Status ?? milestone.Status;
            milestone.Responsible = dto.Responsible?.Trim();

            if (milestone.ActualDate.HasValue && milestone.PlannedDate.HasValue)
            {
                milestone.DelayDays = (int)Math.Max(0, (milestone.ActualDate.Value.Date - milestone.PlannedDate.Value.Date).TotalDays);
            }
            else
            {
                milestone.DelayDays = null;
            }

            milestone.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new MilestoneDto
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                ProjectTitle = milestone.Project?.Title,
                DepartmentId = milestone.DepartmentId,
                Name = milestone.Name,
                Description = milestone.Description,
                PlannedDate = milestone.PlannedDate,
                ActualDate = milestone.ActualDate,
                Status = milestone.Status,
                Responsible = milestone.Responsible,
                DelayDays = milestone.DelayDays,
                Source = milestone.Source,
                CreatedAt = milestone.CreatedAt,
                UpdatedAt = milestone.UpdatedAt
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteMilestone(int id)
        {
            var milestone = await _context.Milestones.FindAsync(id);
            if (milestone == null)
            {
                return NotFound(new { message = "Milestone not found." });
            }

            _context.Milestones.Remove(milestone);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
