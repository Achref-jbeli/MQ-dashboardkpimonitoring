using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;

namespace DashboardKpi.Application.Features.Authentication.Handlers;

public class ResetPasswordCommandHandler
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IPasswordHasher _hasher;

    public ResetPasswordCommandHandler(
        IEmployeeRepository employeeRepository,
        IPasswordHasher hasher)
    {
        _employeeRepository = employeeRepository;
        _hasher = hasher;
    }

    public async Task<ResetPasswordResponse> Handle(ResetPasswordCommand command)
    {
        if (command.EmployeeId <= 0)
        {
            throw new ArgumentException("Invalid employee identifier.");
        }

        if (string.IsNullOrWhiteSpace(command.NewPassword) || command.NewPassword.Length < 6)
        {
            throw new ArgumentException("Password must be at least 6 characters long.");
        }

        var employee = await _employeeRepository.GetByIdAsync(command.EmployeeId);
        if (employee == null || !employee.IsActive)
        {
            throw new KeyNotFoundException("Employee account not found or inactive.");
        }

        employee.PasswordHash = _hasher.Hash(command.NewPassword);
        await _employeeRepository.UpdateEmployeeAsync(employee);

        return new ResetPasswordResponse
        {
            Success = true,
            Message = "Your password has been successfully reset. You can now log in with your new password.",
        };
    }
}
