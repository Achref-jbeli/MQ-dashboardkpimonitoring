using DashboardKpi.Application.Features.Authentication;
using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.Authentication.Handlers;
public class LogoutCommandHandler
{
    private readonly IEmployeeRepository _repository;
    private readonly IJwtService _jwt;
    private readonly IPasswordHasher _hasher;
    private readonly IEmailSender _emailSender;
    private readonly ITotpService _totpService;

    public LogoutCommandHandler(
        IEmployeeRepository repository,
        IJwtService jwt,
        IPasswordHasher hasher,
        IEmailSender emailSender,
        ITotpService totpService)
    {
        _repository = repository;
        _jwt = jwt;
        _hasher = hasher;
        _emailSender = emailSender;
        _totpService = totpService;
    }

    public async Task<LogoutResponse> Handle(LogoutCommand request)
    {
        var normalizedEmail = request.Email.Trim();
        var employee = await _repository.GetByEmailAsync(normalizedEmail);

        

        return new LogoutResponse
        {
            FullName = $"{employee!.FirstName} {employee!.LastName}",
            Role = AuthRoleResolver.Resolve(employee!),
            Message = "Logout successful."
        };
        }

    private static string GenerateOtp()
    {
        return Random.Shared.Next(0, 1_000_000).ToString("D6");
    }
}