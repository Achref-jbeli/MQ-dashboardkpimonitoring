using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DashboardKpi.Application.Features.Authentication;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DashboardKpi.Infrastructure.Authentication;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(Employee employee)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var secret = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
        var issuer = jwtSection["Issuer"] ?? "DashboardKpi.Api";
        var audience = jwtSection["Audience"] ?? issuer;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, employee.Id.ToString()),
            new(ClaimTypes.NameIdentifier, employee.Id.ToString()),
            new(ClaimTypes.Email, employee.Email ?? string.Empty),
            new(ClaimTypes.Role, AuthRoleResolver.Resolve(employee)),
            new("department", employee.Department ?? string.Empty)
        };

        if (employee.DepartmentId.HasValue)
        {
            claims.Add(new Claim("department_id", employee.DepartmentId.Value.ToString()));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}