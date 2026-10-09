using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.Authentication.Interfaces;

public interface IJwtService
{
    string GenerateToken(Employee employee);
}