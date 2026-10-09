using DashboardKpi.Application.Features.TwoFactor.Commands;
using DashboardKpi.Application.Features.TwoFactor.DTOs;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Application.Features.Authentication.Interfaces;

namespace DashboardKpi.Application.Features.TwoFactor.Handlers;

public class EnableGoogleTwoFactorHandler
{
    private readonly ITwoFactorRepository _twoFactorRepository;
    private readonly ITotpService _totpService;
    private readonly IEmployeeRepository _employeeRepository;

    public EnableGoogleTwoFactorHandler(
        ITwoFactorRepository twoFactorRepository, 
        ITotpService totpService,
        IEmployeeRepository employeeRepository)
    {
        _twoFactorRepository = twoFactorRepository;
        _totpService = totpService;
        _employeeRepository = employeeRepository;
    }

    public async Task<TwoFactorSetupResponse> Handle(EnableGoogleTwoFactorCommand command)
    {
        var employee = await _employeeRepository.GetByIdAsync(command.EmployeeId);
        if (employee == null)
            throw new Exception("Employee not found");

        var config = await _twoFactorRepository.GetConfigurationAsync(command.EmployeeId);
        var secret = _totpService.GenerateSecret();

        if (config == null)
        {
            config = new TwoFactorConfigurations
            {
                EmployeeId = command.EmployeeId,
                Provider = "GoogleAuthenticator",
                SecretKey = secret,
                Enabled = false,
                CreatedAt = DateTime.UtcNow
            };
            await _twoFactorRepository.SaveConfigurationAsync(config);
        }
        else
        {
            config.Provider = "GoogleAuthenticator";
            config.SecretKey = secret;
            config.Enabled = false; // Requires verification to become fully enabled
            await _twoFactorRepository.UpdateAsync(config);
        }

        var qrCodeUri = _totpService.GenerateQrCode(employee.Email ?? employee.Id.ToString(), secret);

        return new TwoFactorSetupResponse
        {
            SecretKey = secret,
            Provider = "GoogleAuthenticator",
            QrCodeUri = qrCodeUri
        };
    }
}
