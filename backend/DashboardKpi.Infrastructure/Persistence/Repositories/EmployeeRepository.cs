using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Persistence.Repositories;

public class EmployeeRepository : IEmployeeRepository
{
    private readonly ApplicationDbContext _context;

    public EmployeeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Employee?> GetByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await _context.Employees.FirstOrDefaultAsync(employee => employee.Email != null && employee.Email.ToLower() == normalized);
    }

    public async Task<Employee?> GetByIdAsync(int id)
    {
        return await _context.Employees.FirstOrDefaultAsync(employee => employee.Id == id);
    }

    public async Task<Department?> GetDepartmentByIdAsync(int departmentId)
    {
        return await _context.Departments.FirstOrDefaultAsync(department => department.Id == departmentId);
    }

    public async Task<int> CreateEmployeeAsync(Employee employee)
    {
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();
        return employee.Id;
    }

    public async Task<int> CreateTwoFactorChallengeAsync(TwoFactorChallenge challenge)
    {
        _context.TwoFactorChallenges.Add(challenge);
        await _context.SaveChangesAsync();
        return challenge.Id;
    }

    public async Task<TwoFactorChallenge?> GetTwoFactorChallengeByIdAsync(int challengeId)
    {
        return await _context.TwoFactorChallenges.FirstOrDefaultAsync(challenge => challenge.Id == challengeId);
    }

    public async Task UpdateTwoFactorChallengeAsync(TwoFactorChallenge challenge)
    {
        _context.TwoFactorChallenges.Update(challenge);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasPendingAccountRequestAsync(int employeeId)
    {
        return await _context.AccountCreationRequests.AnyAsync(request => request.EmployeeId == employeeId && request.Status == "Pending");
    }

    public async Task<int> CreateAccountCreationRequestAsync(AccountCreationRequest request)
    {
        _context.AccountCreationRequests.Add(request);
        await _context.SaveChangesAsync();
        return request.Id;
    }

    public async Task UpdateEmployeeAsync(Employee employee)
    {
        _context.Employees.Update(employee);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Employee employee)
    {
        await UpdateEmployeeAsync(employee);
    }
}