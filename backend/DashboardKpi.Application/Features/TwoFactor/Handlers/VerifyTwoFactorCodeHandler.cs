using DashboardKpi.Application.Features.TwoFactor.Commands;
using DashboardKpi.Application.Features.TwoFactor.DTOs;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Application.Features.Authentication.Interfaces;

namespace DashboardKpi.Application.Features.TwoFactor.Handlers;

public class VerifyTwoFactorCodeHandler
{
    private readonly ITwoFactorRepository _twoFactorRepository;
    private readonly ITotpService _totpService;
    private readonly IEmployeeRepository _employeeRepository;

    public VerifyTwoFactorCodeHandler(
        ITwoFactorRepository twoFactorRepository,
        ITotpService totpService,
        IEmployeeRepository employeeRepository)
    {
        _twoFactorRepository = twoFactorRepository;
        _totpService = totpService;
        _employeeRepository = employeeRepository;
    }

    public async Task<TwoFactorStatusDto> Handle(VerifyTwoFactorCodeCommand command)
    {
        var config = await _twoFactorRepository.GetConfigurationAsync(command.EmployeeId);
        
        if (config == null)
            throw new Exception("Two-Factor configuration not found.");

        bool isValid = false;

        if (config.Provider == "GoogleAuthenticator")
        {
            if (string.IsNullOrEmpty(config.SecretKey))
                throw new Exception("Secret key is missing.");

            isValid = _totpService.ValidateCode(config.SecretKey, command.Code);
        }
        else if (config.Provider == "Email")
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
        }
        else
        {
            throw new Exception("Invalid 2FA provider.");
        }

        if (isValid)
        {
            config.Enabled = true;
            await _twoFactorRepository.UpdateAsync(config);

            var employee = await _employeeRepository.GetByIdAsync(command.EmployeeId);
            if (employee != null)
            {
                employee.TwoFactorEnabled = true;
                employee.TwoFactorProvider = config.Provider;
                await _employeeRepository.UpdateEmployeeAsync(employee);
            }
        }
        else
        {
            throw new UnauthorizedAccessException("Invalid two-factor code.");
        }

        return new TwoFactorStatusDto
        {
            IsEnabled = config.Enabled,
            Provider = config.Provider
        };
    }
}
