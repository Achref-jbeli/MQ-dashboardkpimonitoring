using DashboardKpi.Application.Features.TwoFactor.Commands;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Application.Features.Authentication.Interfaces;

namespace DashboardKpi.Application.Features.TwoFactor.Handlers;

public class EnableEmailTwoFactorHandler
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ITwoFactorRepository _twoFactorRepository;
    private readonly IEmailSender _emailSender;

    public EnableEmailTwoFactorHandler(
        IEmployeeRepository employeeRepository,
        ITwoFactorRepository twoFactorRepository,
        IEmailSender emailSender)
    {
        _employeeRepository = employeeRepository;
        _twoFactorRepository = twoFactorRepository;
        _emailSender = emailSender;
    }

    public async Task Handle(EnableEmailTwoFactorCommand command)
    {
        var employee = await _employeeRepository.GetByIdAsync(command.EmployeeId);

        if (employee == null)
            throw new Exception("Employee not found");

        var config = await _twoFactorRepository.GetConfigurationAsync(command.EmployeeId);
        if (config == null)
        {
            config = new TwoFactorConfigurations
            {
                EmployeeId = command.EmployeeId,
                Provider = "Email",
                Enabled = false,
                CreatedAt = DateTime.UtcNow
            };
            await _twoFactorRepository.SaveConfigurationAsync(config);
        }
        else
        {
            config.Provider = "Email";
            config.Enabled = false;
            await _twoFactorRepository.UpdateAsync(config);
        }

        var code = Random.Shared.Next(100000, 999999).ToString();

        var challenge = new TwoFactorChallenge
        {
            EmployeeId = employee.Id,
            Code = code,
            Expiration = DateTime.UtcNow.AddMinutes(5),
            Used = false
        };

        await _twoFactorRepository.CreateChallengeAsync(challenge);

        if (!string.IsNullOrEmpty(employee.Email))
        {
            await _emailSender.SendAsync(
                employee.Email,
                "Your Two-Factor Authentication Code",
                $"Your 2FA code is: {code}. It will expire in 5 minutes."
            );
        }
    }
}
