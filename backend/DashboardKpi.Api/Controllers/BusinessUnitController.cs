using DashboardKpi.Application.Dtos.BusinessUnit;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Administrator,Manager,TeamLeader")]
public class BusinessUnitController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BusinessUnitController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BusinessUnitDto>>> GetBusinessUnits()
    {
        var units = await _context.BusinessUnits
            .OrderBy(u => u.Name)
            .Select(u => new BusinessUnitDto { Id = u.Id, Name = u.Name })
            .ToListAsync();
        return Ok(units);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BusinessUnitDto>> GetBusinessUnit(int id)
    {
        var unit = await _context.BusinessUnits.FindAsync(id);
        if (unit == null) return NotFound();

        return Ok(new BusinessUnitDto { Id = unit.Id, Name = unit.Name });
    }

    [Authorize(Roles = "SuperAdmin,Administrator")]
    [HttpPost]
    public async Task<ActionResult<BusinessUnitDto>> CreateBusinessUnit(AddBusinessUnitDto dto)
    {
        var unit = new BusinessUnit { Name = dto.Name };
        _context.BusinessUnits.Add(unit);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBusinessUnit), new { id = unit.Id }, new BusinessUnitDto { Id = unit.Id, Name = unit.Name });
    }

    [Authorize(Roles = "SuperAdmin,Administrator")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBusinessUnit(int id, AddBusinessUnitDto dto)
    {
        var unit = await _context.BusinessUnits.FindAsync(id);
        if (unit == null) return NotFound();

        unit.Name = dto.Name;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "SuperAdmin,Administrator")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBusinessUnit(int id)
    {
        var unit = await _context.BusinessUnits.FindAsync(id);
        if (unit == null) return NotFound();

        _context.BusinessUnits.Remove(unit);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
