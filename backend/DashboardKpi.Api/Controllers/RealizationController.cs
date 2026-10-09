using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrator,Manager,SuperAdmin")]
    public class RealizationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RealizationController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/Realization?departmentId=1&year=2025
        [HttpGet]
        public async Task<IActionResult> GetEntries(
            [FromQuery] int departmentId,
            [FromQuery] int? year = null)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;

            var entries = await _context.RealizationEntries
                .AsNoTracking()
                .Where(r => r.DepartmentId == departmentId && r.Year == targetYear)
                .OrderBy(r => r.Month)
                .Select(r => new RealizationEntryDto
                {
                    Id = r.Id,
                    DepartmentId = r.DepartmentId,
                    Month = r.Month,
                    Year = r.Year,
                    PlannedValue = r.PlannedValue,
                    RealizedValue = r.RealizedValue,
                    TargetValue = r.TargetValue,
                    ForecastValue = r.ForecastValue,
                    UpdatedAt = r.UpdatedAt,
                })
                .ToListAsync();

            return Ok(entries);
        }

        // PUT /api/Realization  (upsert a single month entry)
        [HttpPut]
        public async Task<IActionResult> Upsert([FromBody] UpsertRealizationEntryDto dto)
        {
            if (dto.Month < 1 || dto.Month > 12)
                return BadRequest("Month must be between 1 and 12.");

            var existing = await _context.RealizationEntries
                .FirstOrDefaultAsync(r =>
                    r.DepartmentId == dto.DepartmentId &&
                    r.Year == dto.Year &&
                    r.Month == dto.Month);

            if (existing == null)
            {
                existing = new RealizationEntry
                {
                    DepartmentId = dto.DepartmentId,
                    Month = dto.Month,
                    Year = dto.Year,
                };
                _context.RealizationEntries.Add(existing);
            }

            existing.PlannedValue = dto.PlannedValue;
            existing.RealizedValue = dto.RealizedValue;
            existing.TargetValue = dto.TargetValue;
            existing.ForecastValue = dto.ForecastValue;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new RealizationEntryDto
            {
                Id = existing.Id,
                DepartmentId = existing.DepartmentId,
                Month = existing.Month,
                Year = existing.Year,
                PlannedValue = existing.PlannedValue,
                RealizedValue = existing.RealizedValue,
                TargetValue = existing.TargetValue,
                ForecastValue = existing.ForecastValue,
                UpdatedAt = existing.UpdatedAt,
            });
        }

        // DELETE /api/Realization/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entry = await _context.RealizationEntries.FindAsync(id);
            if (entry == null) return NotFound();

            _context.RealizationEntries.Remove(entry);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // ── Inline DTOs (no separate Application project needed) ──────────────────
    public class RealizationEntryDto
    {
        public int Id { get; set; }
        public int DepartmentId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal PlannedValue { get; set; }
        public decimal RealizedValue { get; set; }
        public decimal? TargetValue { get; set; }
        public decimal? ForecastValue { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpsertRealizationEntryDto
    {
        public int DepartmentId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal PlannedValue { get; set; }
        public decimal RealizedValue { get; set; }
        public decimal? TargetValue { get; set; }
        public decimal? ForecastValue { get; set; }
    }
}
