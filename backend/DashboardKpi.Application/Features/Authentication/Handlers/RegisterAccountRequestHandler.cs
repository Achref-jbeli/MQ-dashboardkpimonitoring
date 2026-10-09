using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.Authentication.Handlers;

public class RegisterAccountRequestHandler
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "SuperAdmin",
        "Administrator",
        "Manager",
        "TeamLeader"
    };

    private readonly IEmployeeRepository _repository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITotpService _totpService;

    public RegisterAccountRequestHandler(
        IEmployeeRepository repository,
        IPasswordHasher passwordHasher,
        ITotpService totpService)
    {
        _repository = repository;
        _passwordHasher = passwordHasher;
        _totpService = totpService;
    }

    public async Task<RegisterAccountRequestResponse> Handle(RegisterAccountRequestCommand command)
    {
        var normalizedEmail = command.Email.Trim().ToLowerInvariant();
        string? provider = command.TwoFactorProvider?.Trim().ToLowerInvariant();

        if (!command.DepartmentId.HasValue)
        {
            throw new InvalidOperationException("DepartmentId is required.");
        }

        var department = await _repository.GetDepartmentByIdAsync(command.DepartmentId.Value);
        if (department == null)
        {
            throw new InvalidOperationException("Selected department does not exist.");
        }

        if (provider is not ("email" or "google" or null))
        {
            throw new InvalidOperationException("TwoFactorProvider must be 'email' or 'google'.");
        }

        if (!AllowedRoles.Contains(command.AccountType))
        {
            throw new InvalidOperationException("AccountType must be SuperAdmin, Administrator, Manager, or TeamLeader.");
        }

        var employee = await _repository.GetByEmailAsync(normalizedEmail);
        if (employee == null)
        {
            employee = new Employee
            {
                FirstName = "Pending",
                LastName = "User",
                Email = normalizedEmail,
                Position = NormalizeRole(command.AccountType),
                Role = NormalizeRole(command.AccountType),
                IsActive = true,
                IsAccountApproved = false,
                DepartmentId = department.Id,
                Department = department.Name,
            };

            employee.Id = await _repository.CreateEmployeeAsync(employee);
        }
        else
        {
            employee.DepartmentId = department.Id;
            employee.Department = department.Name;
            await _repository.UpdateEmployeeAsync(employee);
        }

        if (employee.IsAccountApproved && !string.IsNullOrWhiteSpace(employee.PasswordHash))
        {
            throw new InvalidOperationException("Account already exists for this employee email.");
        }

        var hasPending = await _repository.HasPendingAccountRequestAsync(employee.Id);
        if (hasPending)
        {
            throw new InvalidOperationException("There is already a pending request for this employee.");
        }

        var googleSecret = provider == "google"
            ? string.IsNullOrWhiteSpace(command.GoogleAuthenticatorSecret)
                ? _totpService.GenerateSecret()
                : command.GoogleAuthenticatorSecret.Trim().ToUpperInvariant()
            : null;

        var request = new AccountCreationRequest
        {
            EmployeeId = employee.Id,
            Email = normalizedEmail,
            RequestedRole = NormalizeRole(command.AccountType),
            PasswordHash = _passwordHasher.Hash(command.Password),
            TwoFactorProvider = provider,
            GoogleAuthenticatorSecret = googleSecret,
            Status = "Pending",
            RequestedAtUtc = DateTime.UtcNow
        };

        request.Id = await _repository.CreateAccountCreationRequestAsync(request);

        return new RegisterAccountRequestResponse
        {
            RequestId = request.Id,
            Message = "Account request submitted. Wait for admin approval.",
            GoogleAuthenticatorSecret = googleSecret,
            GoogleOtpAuthUri = googleSecret == null
                ? null
                : $"otpauth://totp/DashboardKpi:{normalizedEmail}?secret={googleSecret}&issuer=DashboardKpi"
        };
    }

    private static string NormalizeRole(string input)
    {
        if (input.Equals("superadmin", StringComparison.OrdinalIgnoreCase))
        {
            return "SuperAdmin";
        }

        if (input.Equals("administrator", StringComparison.OrdinalIgnoreCase))
        {
            return "Administrator";
        }

        if (input.Equals("manager", StringComparison.OrdinalIgnoreCase))
        {
            return "Manager";
        }

        return "TeamLeader";
    }
}
