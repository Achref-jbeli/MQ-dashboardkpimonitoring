using System.Security.Claims;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Extensions;

public static class UserScopeExtensions
{
    public static bool IsSuperAdmin(this ClaimsPrincipal user)
        => user.IsInRole("SuperAdmin");

    public static bool TryGetEmployeeId(this ClaimsPrincipal user, out int employeeId)
    {
        employeeId = 0;

        var rawId = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("EmployeeId")
            ?? user.FindFirstValue("sub");

        return int.TryParse(rawId, out employeeId);
    }

    public static async Task<Employee?> GetCurrentEmployeeAsync(this ClaimsPrincipal user, ApplicationDbContext context)
    {
        if (!user.TryGetEmployeeId(out var employeeId))
        {
            return null;
        }

        return await context.Employees.FirstOrDefaultAsync(employee => employee.Id == employeeId);
    }

    public static async Task<int?> GetCurrentDepartmentIdAsync(this ClaimsPrincipal user, ApplicationDbContext context)
    {
        var employee = await user.GetCurrentEmployeeAsync(context);
        return employee?.DepartmentId;
    }

    public static async Task<int?> ResolveDepartmentScopeAsync(
        this ClaimsPrincipal user,
        ApplicationDbContext context,
        int? requestedDepartmentId = null)
    {
        if (user.IsSuperAdmin())
        {
            if (requestedDepartmentId.HasValue)
            {
                return requestedDepartmentId;
            }

            return await user.GetCurrentDepartmentIdAsync(context);
        }

        var currentDepartmentId = await user.GetCurrentDepartmentIdAsync(context);
        if (!currentDepartmentId.HasValue)
        {
            return null;
        }

        if (requestedDepartmentId.HasValue && requestedDepartmentId.Value != currentDepartmentId.Value)
        {
            return null;
        }

        return currentDepartmentId;
    }
}
