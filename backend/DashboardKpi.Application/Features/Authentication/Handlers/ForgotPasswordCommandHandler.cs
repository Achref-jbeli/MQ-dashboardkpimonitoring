using System.Security.Cryptography;
using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.Authentication.Handlers;

public class ForgotPasswordCommandHandler
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ITwoFactorRepository _twoFactorRepository;
    private readonly IEmailSender _emailSender;

    public ForgotPasswordCommandHandler(
        IEmployeeRepository employeeRepository,
        ITwoFactorRepository twoFactorRepository,
        IEmailSender emailSender)
    {
        _employeeRepository = employeeRepository;
        _twoFactorRepository = twoFactorRepository;
        _emailSender = emailSender;
    }

    public async Task<ForgotPasswordResponse> Handle(ForgotPasswordRequestCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
        {
            throw new ArgumentException("Email address is required.");
        }

        var normalizedEmail = command.Email.Trim();
        var employee = await _employeeRepository.GetByEmailAsync(normalizedEmail);

        if (employee == null || !employee.IsActive)
        {
            throw new KeyNotFoundException("No active account found for this email address.");
        }

        var config = await _twoFactorRepository.GetConfigurationAsync(employee.Id);
        var configuredProvider = (config?.Provider ?? employee.TwoFactorProvider ?? "email").Trim().ToLowerInvariant();

        if (configuredProvider == "google" || configuredProvider == "googleauthenticator")
        {
            if (config != null && config.Enabled && !string.IsNullOrWhiteSpace(config.SecretKey))
            {
                return new ForgotPasswordResponse
                {
                    RequiresTwoFactor = true,
                    Provider = "google",
                    EmployeeId = employee.Id,
                    Message = "Please enter the 6-digit verification code from your Google Authenticator app.",
                };
            }
        }

        // Default or Email provider: generate 6-digit OTP challenge and email it
        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var challenge = new TwoFactorChallenge
        {
            EmployeeId = employee.Id,
            Code = code,
            Expiration = DateTime.UtcNow.AddMinutes(15),
            Used = false,
        };

        await _twoFactorRepository.CreateChallengeAsync(challenge);

        var recipientEmail = employee.Email ?? normalizedEmail;
        await _emailSender.SendAsync(
            recipientEmail,
            "Dashboard KPI - Password Reset Verification Code",
            $"Hello {employee.FirstName},\n\nYour password reset verification code is: {code}\n\nThis verification code expires in 15 minutes.\nIf you did not request a password reset, please ignore this email."
        );

        return new ForgotPasswordResponse
        {
            RequiresTwoFactor = true,
            Provider = "email",
            EmployeeId = employee.Id,
            Message = "A 6-digit verification code has been sent to your email address.",
        };
    }
}
