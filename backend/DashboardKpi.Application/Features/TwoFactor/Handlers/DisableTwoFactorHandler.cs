using DashboardKpi.Application.Features.TwoFactor.Commands;
using DashboardKpi.Application.Features.TwoFactor.DTOs;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Application.Features.Authentication.Interfaces;

namespace DashboardKpi.Application.Features.TwoFactor.Handlers;

public class DisableTwoFactorHandler
{
    private readonly ITwoFactorRepository _twoFactorRepository;
    private readonly IEmployeeRepository _employeeRepository;

    public DisableTwoFactorHandler(
        ITwoFactorRepository twoFactorRepository,
        IEmployeeRepository employeeRepository)
    {
        _twoFactorRepository = twoFactorRepository;
        _employeeRepository = employeeRepository;
    }

    public async Task<TwoFactorStatusDto> Handle(DisableTwoFactorCommand command)
    {
        var config = await _twoFactorRepository.GetConfigurationAsync(command.EmployeeId);
        
        if (config != null)
        {
            config.Enabled = false;
            config.SecretKey = null; // Clear the secret when disabling
            await _twoFactorRepository.UpdateAsync(config);

            var employee = await _employeeRepository.GetByIdAsync(command.EmployeeId);
            if (employee != null)
            {
                employee.TwoFactorEnabled = false;
                employee.TwoFactorProvider = null;
                await _employeeRepository.UpdateEmployeeAsync(employee);
            }
        }

        return new TwoFactorStatusDto
        {
            IsEnabled = false,
            Provider = config?.Provider ?? ""
        };
    }
}
