using Microsoft.AspNetCore.Mvc;
using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Api.Extensions;
using DashboardKpi.Infrastructure.Data;

namespace DashboardKpi.Api.Controllers{

[Authorize(Roles="Manager")]
[ApiController]
[Route("api/managers")]
public class ManagerController : ControllerBase
{
    private readonly IManagerService _service;
    private readonly IAdminService _adminService;
    private readonly ApplicationDbContext _context;

    public ManagerController(IManagerService service, IAdminService adminService, ApplicationDbContext context)
    {
        _service = service;
        _adminService = adminService;
        _context = context;
    }

    private async Task<int?> ResolveDepartmentIdAsync()
        => await User.GetCurrentDepartmentIdAsync(_context);

    private int? ResolveReviewerId()
        => User.TryGetEmployeeId(out var employeeId) ? employeeId : null;

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

    [HttpGet("account-requests/pending")]
    public async Task<IActionResult> GetPendingAccountRequests()
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue)
        {
            return Forbid();
        }

        return Ok(await _adminService.GetPendingAccountRequestsAsync(departmentId.Value));
    }

    [HttpPost("account-requests/{requestId:int}/approve")]
    public async Task<IActionResult> ApproveAccountRequest(int requestId)
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue)
        {
            return Forbid();
        }

        var approved = await _adminService.ApproveAccountRequestAsync(requestId, departmentId.Value, ResolveReviewerId());
        return approved ? Ok(new { message = "Account request approved." }) : NotFound();
    }

    [HttpPost("account-requests/{requestId:int}/reject")]
    public async Task<IActionResult> RejectAccountRequest(int requestId, [FromBody] RejectAccountRequestBody body)
    {
        var departmentId = await ResolveDepartmentIdAsync();
        if (!departmentId.HasValue)
        {
            return Forbid();
        }

        var rejected = await _adminService.RejectAccountRequestAsync(requestId, departmentId.Value, ResolveReviewerId(), body?.Reason);
        return rejected ? Ok(new { message = "Account request rejected." }) : NotFound();
    }
}
}