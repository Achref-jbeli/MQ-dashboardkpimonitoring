using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DashboardKpi.Application.Dtos.Event;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using DashboardKpi.Api.Extensions;

namespace DashboardKpi.Api.Controllers
{
    [Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class EventController : ControllerBase
    {
        private readonly ApplicationDbContext dbcontext;

        public EventController(ApplicationDbContext dbcontext)
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

        [HttpGet]
        public async Task<IActionResult> GetEvents([FromQuery] int? departmentId)
        {
            var query = dbcontext.Events.AsQueryable();

            // Only apply department filter when explicitly requested
            if (departmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == departmentId.Value);
            }

            var events = await query.ToListAsync();
            return Ok(events);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventById(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Events.Where(e => e.Id == id);
            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(e => e.DepartmentId == resolvedDepartmentId.Value);
            }

            var eventEntity = await query.FirstOrDefaultAsync();
            if (eventEntity == null)
            {
                return NotFound();
            }
            return Ok(eventEntity);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] AddEventDto addEventDto)
        {
            var departmentId = await ResolveDepartmentIdAsync(addEventDto.DepartmentId);
            if (!departmentId.HasValue)
            {
                return Forbid();
            }

            var eventEntity = new Event
            {
                Title = addEventDto.Title,
                Description = addEventDto.Description,
                Date = addEventDto.Date,
                Location = addEventDto.Location,
                Type = addEventDto.Type,
                ImageUrl = addEventDto.ImageUrl,
                DepartmentId = departmentId.Value,
                EmployeeId = addEventDto.EmployeeId
            };

            dbcontext.Events.Add(eventEntity);
            await dbcontext.SaveChangesAsync();
            return Ok(eventEntity);
        }
        

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(int id, [FromBody] UpdateEventDto updateEventDto, [FromQuery] int? departmentId)
        {
            var sourceDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!sourceDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Events.Where(item => item.Id == id);
            if (sourceDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == sourceDepartmentId.Value || item.DepartmentId == null);
            }

            var eventEntity = await query.FirstOrDefaultAsync();
            if (eventEntity == null)
            {
                return NotFound();
            }

            var resolvedTargetDepartmentId = await ResolveDepartmentIdAsync(updateEventDto.DepartmentId ?? departmentId ?? eventEntity.DepartmentId);
            if (!resolvedTargetDepartmentId.HasValue)
            {
                return BadRequest(new { message = "DepartmentId is required." });
            }
            if (updateEventDto.Title != null)
                eventEntity.Title = updateEventDto.Title;
            if (updateEventDto.Description != null)
                eventEntity.Description = updateEventDto.Description;
            if (updateEventDto.Date.HasValue)
                eventEntity.Date = updateEventDto.Date;
            if (updateEventDto.Location != null)
                eventEntity.Location = updateEventDto.Location;
            if (updateEventDto.Type != null)
                eventEntity.Type = updateEventDto.Type;
            if (updateEventDto.ImageUrl != null)
                eventEntity.ImageUrl = updateEventDto.ImageUrl;
            if (updateEventDto.EmployeeId.HasValue)
                eventEntity.EmployeeId = updateEventDto.EmployeeId;
            eventEntity.DepartmentId = resolvedTargetDepartmentId.Value;
            await dbcontext.SaveChangesAsync();
            return Ok(eventEntity);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.Events.Where(item => item.Id == id);
            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == resolvedDepartmentId.Value);
            }

            var eventEntity = await query.FirstOrDefaultAsync();
            if (eventEntity == null)
            {
                return NotFound();
            }
            dbcontext.Events.Remove(eventEntity);
            await dbcontext.SaveChangesAsync();
            return NoContent();
        }
    }
}