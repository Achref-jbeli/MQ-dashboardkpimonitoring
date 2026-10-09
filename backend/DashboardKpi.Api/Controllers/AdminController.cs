using Microsoft.AspNetCore.Mvc;
using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using DashboardKpi.Api.Extensions;
using DashboardKpi.Infrastructure.Data;
namespace DashboardKpi.Api.Controllers{

[Authorize(Roles="Administrator,SuperAdmin")]
[ApiController]
[Route("api/admins")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _service;
    private readonly ApplicationDbContext _context;

    public AdminController(IAdminService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
    }

    private async Task<int?> ResolveDepartmentIdAsync(int? requestedDepartmentId = null, bool allowGlobalForSuperAdmin = false)
    {
        if (allowGlobalForSuperAdmin && User.IsSuperAdmin() && !requestedDepartmentId.HasValue)
        {
            return null;
        }

        return await User.ResolveDepartmentScopeAsync(_context, requestedDepartmentId);
    }

    private int? ResolveReviewerId()
        => User.TryGetEmployeeId(out var employeeId) ? employeeId : null;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
        if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
        {
            return Forbid();
        }

        return Ok(await _service.GetAllAsync(resolvedDepartmentId));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody]AddEmployeeDto dto, [FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId ?? dto.DepartmentId);
        if (!resolvedDepartmentId.HasValue)
        {
            return Forbid();
        }

        try
        {
            return Ok(await _service.CreateAsync(dto, resolvedDepartmentId));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody]UpdateEmployeeDto dto, [FromQuery] int? departmentId)
    {
        // Scope is the caller's own department (or global for SuperAdmin) — never the requested target department.
        var callerDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
        if (!callerDepartmentId.HasValue && !User.IsSuperAdmin())
        {
            return Forbid();
        }

        try
        {
            var updated = await _service.UpdateAsync(id, dto, callerDepartmentId, User.IsSuperAdmin());
            return updated == null ? NotFound() : Ok(updated);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
        if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
        {
            return Forbid();
        }

        var deleted = await _service.DeleteAsync(id, resolvedDepartmentId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("account-requests/pending")]
    public async Task<IActionResult> GetPendingAccountRequests([FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
        if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
        {
            return Forbid();
        }

        return Ok(await _service.GetPendingAccountRequestsAsync(resolvedDepartmentId));
    }

    [HttpGet("account-requests")]
    public async Task<IActionResult> GetAccountRequests([FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
        if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
        {
            return Forbid();
        }

        return Ok(await _service.GetAccountRequestsAsync(resolvedDepartmentId));
    }

    [HttpPost("account-requests/{requestId:int}/approve")]
    public async Task<IActionResult> ApproveAccountRequest(int requestId, [FromQuery] int? adminId, [FromQuery] int? departmentId)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId, allowGlobalForSuperAdmin: true);
        if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
        {
            return Forbid();
        }

        var reviewerId = adminId ?? ResolveReviewerId();
        var approved = await _service.ApproveAccountRequestAsync(requestId, resolvedDepartmentId, reviewerId);
        return approved ? Ok(new { message = "Account request approved." }) : NotFound();
    }

    [HttpPost("account-requests/{requestId:int}/reject")]
    public async Task<IActionResult> RejectAccountRequest(int requestId, [FromQuery] int? adminId, [FromQuery] int? departmentId, [FromBody] RejectAccountRequestBody body)
    {
        var resolvedDepartmentId = await ResolveDepartmentIdAsync(departmentId);
        if (!resolvedDepartmentId.HasValue && !User.IsSuperAdmin())
        {
            return Forbid();
        }

        var reviewerId = adminId ?? ResolveReviewerId();
        var rejected = await _service.RejectAccountRequestAsync(requestId, resolvedDepartmentId, reviewerId, body?.Reason);
        return rejected ? Ok(new { message = "Account request rejected." }) : NotFound();
    }

}

public class RejectAccountRequestBody
{
    public string? Reason { get; set; }
}}
