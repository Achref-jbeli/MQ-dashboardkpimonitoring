using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.Authentication;

public static class AuthRoleResolver
{
    public static string Resolve(Employee employee) => employee.Role ?? employee.Position ?? "Employee";
}