using Microsoft.AspNetCore.Mvc;
using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Api.Extensions;
using DashboardKpi.Infrastructure.Data;

namespace DashboardKpi.Api.Controllers{

[Authorize(Roles = "Administrator,SuperAdmin,TeamLeader")]
[Route("api/teamleaders")]
public class TeamLeaderController : ControllerBase
{
    private readonly ITeamLeaderService _service;
    private readonly ApplicationDbContext _context;

    public TeamLeaderController(ITeamLeaderService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
    }

    private async Task<int?> ResolveDepartmentIdAsync()
        => await User.GetCurrentDepartmentIdAsync(_context);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue)
        {
            return Forbid();
        }

        return Ok(await _service.GetAllAsync(departmentId.Value));
    }

    [HttpPost]
    public async Task<IActionResult> Create(AddEmployeeDto dto)
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue)
        {
            return Forbid();
        }

        return Ok(await _service.CreateAsync(dto, departmentId.Value));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateEmployeeDto dto)
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue)
        {
            return Forbid();
        }

        var updated = await _service.UpdateAsync(id, dto, departmentId.Value);
        return updated == null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue)
        {
            return Forbid();
        }

        var deleted = await _service.DeleteAsync(id, departmentId.Value);
        return deleted ? NoContent() : NotFound();
    }
}
}