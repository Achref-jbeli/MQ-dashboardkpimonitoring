using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;

namespace DashboardKpi.Application.Features.Authentication.Handlers;

public class VerifyLoginTwoFactorCommandHandler
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ITwoFactorRepository _twoFactorRepository;
    private readonly ITotpService _totpService;
    private readonly IJwtService _jwt;

    public VerifyLoginTwoFactorCommandHandler(
        IEmployeeRepository employeeRepository,
        ITwoFactorRepository twoFactorRepository,
        ITotpService totpService,
        IJwtService jwt)
    {
        _employeeRepository = employeeRepository;
        _twoFactorRepository = twoFactorRepository;
        _totpService = totpService;
        _jwt = jwt;
    }

    public async Task<LoginResponse> Handle(VerifyLoginTwoFactorCommand command)
    {
        var employee = await _employeeRepository.GetByIdAsync(command.EmployeeId);
        if (employee == null) throw new UnauthorizedAccessException("Invalid employee");

        var config = await _twoFactorRepository.GetConfigurationAsync(command.EmployeeId);
        if (config == null || !config.Enabled)
        {
            // If they are in setup mode, they might be verifying to ENABLE it.
            if (config == null) throw new UnauthorizedAccessException("2FA is not configured for this user.");
        }

        bool isValid = false;
        if (config.Provider.ToLowerInvariant() == "googleauthenticator" || config.Provider.ToLowerInvariant() == "google")
        {
            if (string.IsNullOrEmpty(config.SecretKey))
                throw new UnauthorizedAccessException("Google Authenticator secret is missing.");
            isValid = _totpService.ValidateCode(config.SecretKey, command.Code);
        }
        else if (config.Provider.ToLowerInvariant() == "email")
        {
            var challenge = await _twoFactorRepository.GetActiveChallengeAsync(command.EmployeeId);
            if (challenge == null)
            {
                throw new UnauthorizedAccessException("No active challenge found. It may have expired or already been used.");
            }
            if (challenge.Code != command.Code)
            {
                throw new UnauthorizedAccessException($"Invalid two-factor code. Expected: {challenge.Code}, but received: {command.Code}");
            }

            isValid = true;
            challenge.Used = true;
            await _twoFactorRepository.UpdateAsync(config); // Save challenge state implicitly
        }

        if (!isValid) throw new UnauthorizedAccessException("Invalid 2FA code.");

        // If it was setup mode, enable it now.
        if (!config.Enabled)
        {
            config.Enabled = true;
            await _twoFactorRepository.UpdateAsync(config);
        }

        return new LoginResponse
        {
            EmployeeId = employee.Id,
            FullName = $"{employee.FirstName} {employee.LastName}",
            Role = AuthRoleResolver.Resolve(employee),
            Department = employee.Department,
            DepartmentId = employee.DepartmentId,
            Token = _jwt.GenerateToken(employee),
            RequiresTwoFactor = false,
            RequiresTwoFactorSetup = false,
            Message = "Login successful."
        };
    }
}
