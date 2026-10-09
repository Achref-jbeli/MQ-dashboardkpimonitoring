using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;

namespace DashboardKpi.Application.Features.Authentication.Handlers;

public class VerifyResetCodeCommandHandler
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ITwoFactorRepository _twoFactorRepository;
    private readonly ITotpService _totpService;
    private readonly IJwtService _jwtService;

    public VerifyResetCodeCommandHandler(
        IEmployeeRepository employeeRepository,
        ITwoFactorRepository twoFactorRepository,
        ITotpService totpService,
        IJwtService jwtService)
    {
        _employeeRepository = employeeRepository;
        _twoFactorRepository = twoFactorRepository;
        _totpService = totpService;
        _jwtService = jwtService;
    }

    public async Task<VerifyResetCodeResponse> Handle(VerifyResetCodeCommand command)
    {
        if (command.EmployeeId <= 0)
        {
            throw new ArgumentException("Invalid employee identifier.");
        }

        if (string.IsNullOrWhiteSpace(command.Code))
        {
            throw new ArgumentException("Verification code is required.");
        }

        var employee = await _employeeRepository.GetByIdAsync(command.EmployeeId);
        if (employee == null || !employee.IsActive)
        {
            throw new UnauthorizedAccessException("Employee account not found or inactive.");
        }

        var config = await _twoFactorRepository.GetConfigurationAsync(command.EmployeeId);
        var provider = (config?.Provider ?? employee.TwoFactorProvider ?? "email").Trim().ToLowerInvariant();

        bool isValid = false;

        if ((provider == "google" || provider == "googleauthenticator") && config != null && !string.IsNullOrWhiteSpace(config.SecretKey))
        {
            isValid = _totpService.ValidateCode(config.SecretKey, command.Code.Trim());
        }
        else
        {
            var challenge = await _twoFactorRepository.GetActiveChallengeAsync(command.EmployeeId);
            if (challenge != null && challenge.Code == command.Code.Trim())
            {
                isValid = true;
                challenge.Used = true;
                if (config != null)
                {
                    await _twoFactorRepository.UpdateAsync(config);
                }
            }
        }

        if (!isValid)
        {
            throw new UnauthorizedAccessException("Invalid or expired verification code.");
        }

        var resetToken = _jwtService.GenerateToken(employee);

        return new VerifyResetCodeResponse
        {
            Valid = true,
            EmployeeId = employee.Id,
            ResetToken = resetToken,
            Message = "Verification successful. You may now enter your new password.",
        };
    }
}
