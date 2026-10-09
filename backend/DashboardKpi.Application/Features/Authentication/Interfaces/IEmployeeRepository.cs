using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.Authentication.Interfaces;

public interface IEmployeeRepository
{
    Task<Employee?> GetByEmailAsync(string email);
    Task<Employee?> GetByIdAsync(int id);
    Task<Department?> GetDepartmentByIdAsync(int departmentId);
    Task<int> CreateEmployeeAsync(Employee employee);

    Task<int> CreateTwoFactorChallengeAsync(TwoFactorChallenge challenge);
    Task<TwoFactorChallenge?> GetTwoFactorChallengeByIdAsync(int challengeId);
    Task UpdateTwoFactorChallengeAsync(TwoFactorChallenge challenge);

    Task<bool> HasPendingAccountRequestAsync(int employeeId);
    Task<int> CreateAccountCreationRequestAsync(AccountCreationRequest request);

    Task UpdateEmployeeAsync(Employee employee);
    Task UpdateAsync(Employee employee);
}