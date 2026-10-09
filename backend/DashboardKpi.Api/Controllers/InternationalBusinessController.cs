using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using DashboardKpi.Api.Extensions;
using DashboardKpi.Application.Dtos.InternationalBusiness;

namespace DashboardKpi.Api.Controllers
{
    [Authorize(Roles = "Administrator,Manager,TeamLeader,SuperAdmin")]
    [ApiController]
    [Route("api/[controller]")]
    public class InternationalBusinessController : ControllerBase
    {
        private readonly ApplicationDbContext dbcontext;

        public InternationalBusinessController(ApplicationDbContext dbcontext)
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
        public async Task<IActionResult> GetInternationalBusinesses([FromQuery] int? departmentId)
        {
            var query = dbcontext.InternationalBusinesses.AsQueryable();

            // Only filter by department when explicitly requested
            if (departmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == departmentId.Value);
            }

            var internationalBusinesses = await query.ToListAsync();
            return Ok(internationalBusinesses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetInternationalBusiness(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId =
                await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);

            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.InternationalBusinesses.Where(e => e.Id == id);

            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(e => e.DepartmentId == resolvedDepartmentId.Value);
            }

            var internationalBusiness = await query.FirstOrDefaultAsync();

            if (internationalBusiness == null)
                return NotFound();

            return Ok(internationalBusiness);
        }

        [HttpPost]
        public async Task<IActionResult> CreateInternationalBusiness(
            [FromBody] AddInternationalBusinessDto dto,
            [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId);

            if (!resolvedDepartmentId.HasValue)
            {
                return Forbid();
            }

            var internationalBusiness = new InternationalBusiness
            {
                Name = dto.Name,
                Description = dto.Description,
                Country = dto.Country,
                PartnerName = dto.PartnerName,
                Photos = dto.Photos ?? new List<string>(),
                DepartmentId = resolvedDepartmentId.Value,
                IsPublicActive = dto.IsPublicActive,
                IsNewBusiness = dto.IsNewBusiness,
                ProjectInfo = dto.ProjectInfo,
                VolumeLifetime = dto.VolumeLifetime,
                SalesLifetime = dto.SalesLifetime,
                Sop = dto.Sop,
                ProductionLocation = dto.ProductionLocation,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            };

            dbcontext.InternationalBusinesses.Add(internationalBusiness);
            await dbcontext.SaveChangesAsync();

            return Ok(internationalBusiness);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInternationalBusiness(
            int id,
            [FromBody] UpdateInternationalBusinessDto dto,
            [FromQuery] int? departmentId)
        {
            var sourceDepartmentId =
                await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);

            if (!sourceDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.InternationalBusinesses.Where(item => item.Id == id);

            if (sourceDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == sourceDepartmentId.Value);
            }

            var internationalBusiness = await query.FirstOrDefaultAsync();

            if (internationalBusiness == null)
            {
                return NotFound();
            }

            if (dto.Name != null) internationalBusiness.Name = dto.Name;
            if (dto.Description != null) internationalBusiness.Description = dto.Description;
            if (dto.Country != null) internationalBusiness.Country = dto.Country;
            if (dto.PartnerName != null) internationalBusiness.PartnerName = dto.PartnerName;
            if (dto.Photos != null) internationalBusiness.Photos = dto.Photos;
            if (dto.IsPublicActive.HasValue) internationalBusiness.IsPublicActive = dto.IsPublicActive.Value;
            if (dto.IsNewBusiness.HasValue) internationalBusiness.IsNewBusiness = dto.IsNewBusiness.Value;
            if (dto.ProjectInfo != null) internationalBusiness.ProjectInfo = dto.ProjectInfo;
            if (dto.VolumeLifetime != null) internationalBusiness.VolumeLifetime = dto.VolumeLifetime;
            if (dto.SalesLifetime != null) internationalBusiness.SalesLifetime = dto.SalesLifetime;
            if (dto.Sop != null) internationalBusiness.Sop = dto.Sop;
            if (dto.ProductionLocation != null) internationalBusiness.ProductionLocation = dto.ProductionLocation;
            internationalBusiness.UpdatedAtUtc = DateTime.UtcNow;

            await dbcontext.SaveChangesAsync();

            return Ok(internationalBusiness);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInternationalBusiness(int id, [FromQuery] int? departmentId)
        {
            var resolvedDepartmentId =
                await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);

            if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
            {
                return Forbid();
            }

            var query = dbcontext.InternationalBusinesses.Where(item => item.Id == id);

            if (resolvedDepartmentId.HasValue)
            {
                query = query.Where(item => item.DepartmentId == resolvedDepartmentId.Value);
            }

            var internationalBusiness = await query.FirstOrDefaultAsync();

            if (internationalBusiness == null)
            {
                return NotFound();
            }

            dbcontext.InternationalBusinesses.Remove(internationalBusiness);
            await dbcontext.SaveChangesAsync();

            return NoContent();
        }
    }
}