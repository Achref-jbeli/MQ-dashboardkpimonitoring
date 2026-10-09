using DashboardKpi.Application.Features.Authentication;
using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.Authentication.Handlers;

public class LoginCommandHandler
{
    private readonly IEmployeeRepository _repository;
    private readonly IJwtService _jwt;
    private readonly IPasswordHasher _hasher;
    private readonly IEmailSender _emailSender;
    private readonly ITotpService _totpService;
    private readonly ITwoFactorRepository _twoFactorRepository;

    public LoginCommandHandler(
        IEmployeeRepository repository,
        IJwtService jwt,
        IPasswordHasher hasher,
        IEmailSender emailSender,
        ITotpService totpService,
        ITwoFactorRepository twoFactorRepository)
    {
        _repository = repository;
        _jwt = jwt;
        _hasher = hasher;
        _emailSender = emailSender;
        _totpService = totpService;
        _twoFactorRepository = twoFactorRepository;
    }

    public async Task<LoginResponse> Handle(LoginCommand request)
    {
        var normalizedEmail = request.Email.Trim();
        var employee = await _repository.GetByEmailAsync(normalizedEmail);

        if (employee == null || string.IsNullOrWhiteSpace(employee.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }
        if (!employee.IsActive)
        {
            throw new UnauthorizedAccessException("Account is disabled.");
        }

        if (!employee.IsAccountApproved)
        {
            throw new UnauthorizedAccessException("Account exists but is waiting for admin approval.");
        }

        if (!_hasher.Verify(request.Password, employee.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var configuredProvider = (employee.TwoFactorProvider ?? string.Empty).Trim().ToLowerInvariant();
        var existingConfig = await _twoFactorRepository.GetConfigurationAsync(employee.Id);

        // SETUP branch: no config row yet, or one exists but was never completed.
        if ((existingConfig == null || !existingConfig.Enabled)
            && (configuredProvider == "email" || configuredProvider == "google"))
        {
            if (existingConfig == null)
            {
                existingConfig = new TwoFactorConfigurations
                {
                    EmployeeId = employee.Id,
                    Provider = configuredProvider,
                    Enabled = false,
                    SecretKey = configuredProvider == "google" ? _totpService.GenerateSecret() : string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                await _twoFactorRepository.SaveConfigurationAsync(existingConfig);
            }
            else if (configuredProvider == "google" && string.IsNullOrWhiteSpace(existingConfig.SecretKey))
            {
                existingConfig.SecretKey = _totpService.GenerateSecret();
                await _twoFactorRepository.UpdateAsync(existingConfig);
            }

            var challenge = new TwoFactorChallenge
            {
                EmployeeId = employee.Id,
                Expiration = DateTime.UtcNow.AddMinutes(10),
                Used = false,
                Code = configuredProvider == "email" ? GenerateOtp() : string.Empty
            };

            challenge.Id = await _repository.CreateTwoFactorChallengeAsync(challenge);

            if (configuredProvider == "email")
            {
                var email = employee.Email ?? string.Empty;
                await _emailSender.SendAsync(
                    email,
                    "Dashboard KPI setup verification code",
                    $"Your setup verification code is {challenge.Code}. It will expire in 10 minutes.");
            }

            var setupEmail = (employee.Email ?? string.Empty).Trim().ToLowerInvariant();
            return new LoginResponse
            {
                EmployeeId = employee.Id,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Role = AuthRoleResolver.Resolve(employee),
                Department = employee.Department,
                DepartmentId = employee.DepartmentId,
                Token = string.Empty,
                RequiresTwoFactor = false,
                RequiresTwoFactorSetup = true,
                TwoFactorSetupProvider = configuredProvider,
                GoogleAuthenticatorSecret = configuredProvider == "google" ? existingConfig.SecretKey : null,
                GoogleOtpAuthUri = configuredProvider == "google" && !string.IsNullOrWhiteSpace(existingConfig.SecretKey)
                    ? $"otpauth://totp/DashboardKpi:{setupEmail}?secret={existingConfig.SecretKey}&issuer=DashboardKpi"
                    : null,
                ChallengeId = challenge.Id,
                Message = configuredProvider == "email"
                    ? "Two-factor setup required. A verification code was sent to your email."
                    : "Two-factor setup required. Configure Google Authenticator and verify your code."
            };
        }

        // NORMAL 2FA branch: config exists and is already enabled.
        if (existingConfig != null && existingConfig.Enabled)
        {
            var provider = (existingConfig.Provider ?? "email").ToLowerInvariant();
            var challenge = new TwoFactorChallenge
            {
                EmployeeId = employee.Id,
                Expiration = DateTime.UtcNow.AddMinutes(10),
                Used = false,
                Code = provider == "email" ? GenerateOtp() : string.Empty
            };

            challenge.Id = await _repository.CreateTwoFactorChallengeAsync(challenge);

            if (provider == "email")
            {
                var email = employee.Email ?? string.Empty;
                await _emailSender.SendAsync(
                    email,
                    "Dashboard KPI verification code",
                    $"Your verification code is {challenge.Code}. It will expire in 10 minutes.");
            }

            return new LoginResponse
            {
                EmployeeId = employee.Id,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Role = AuthRoleResolver.Resolve(employee),
                Department = employee.Department,
                DepartmentId = employee.DepartmentId,
                Token = string.Empty,
                RequiresTwoFactor = true,
                RequiresTwoFactorSetup = false,
                ChallengeId = challenge.Id,
                Message = provider == "email"
                    ? "Verification code sent to your email."
                    : "Enter your Google Authenticator code to complete login."
            };
        }

        // No 2FA provider configured at all — log in directly.
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
            ChallengeId = null,
            Message = "Login successful."
        };
    }

    private static string GenerateOtp()
    {
        return Random.Shared.Next(0, 1_000_000).ToString("D6");
    }
}