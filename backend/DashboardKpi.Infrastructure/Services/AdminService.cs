using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Dtos.Department;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Services;

public class AdminService : IAdminService
{
    private const string Role = "Administrator";
    private readonly ApplicationDbContext _context;

    public AdminService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<EmployeeDto>> GetAllAsync(int? departmentId)
    {
        var query = _context.Employees
            .Where(employee => employee.Position == Role);

        if (departmentId.HasValue)
        {
            query = query.Where(employee => employee.DepartmentId == departmentId.Value);
        }

        return await query
            .Select(employee => new EmployeeDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                Position = employee.Position,
                Department = string.IsNullOrEmpty(employee.Department) ? null : new DepartmentDto { Name = employee.Department },
                ProfessionalDomain = employee.ProfessionalDomain,
                Seniority = employee.Seniority,
                IsActive = employee.IsActive,
                HireDate = employee.HireDate,
                BirthDate = employee.BirthDate,
                Photo = employee.Photo
            })
            .ToListAsync();
    }

    public async Task<int> CreateAsync(AddEmployeeDto dto, int? departmentId)
    {
        var resolvedDepartmentId = dto.DepartmentId ?? departmentId;
        if (!resolvedDepartmentId.HasValue)
        {
            throw new InvalidOperationException("DepartmentId is required to create an employee.");
        }

        var departmentName = await _context.Departments
            .Where(department => department.Id == resolvedDepartmentId.Value)
            .Select(department => department.Name)
            .FirstOrDefaultAsync();

        if (string.IsNullOrWhiteSpace(departmentName))
        {
            throw new InvalidOperationException("Selected department does not exist.");
        }

        var entity = new Employee
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Position = Role,
            ProfessionalDomain = dto.ProfessionalDomain,
            Seniority = dto.Seniority,
            BirthDate = dto.BirthDate,
            IsActive = dto.IsActive,
            HireDate = dto.HireDate,
            Department = departmentName,
            DepartmentId = resolvedDepartmentId.Value,
            Photo = dto.Photo,
            PasswordHash = null,
            IsAccountApproved = false,
            TwoFactorEnabled = false,
            TwoFactorProvider = null,
            GoogleAuthenticatorSecret = null
        };

        _context.Employees.Add(entity);
        await _context.SaveChangesAsync();
        return entity.Id;
    }

    public async Task<EmployeeDto?> UpdateAsync(int id, UpdateEmployeeDto dto, int? callerDepartmentId, bool isSuperAdmin)
    {
        var query = _context.Employees.Where(employee => employee.Id == id && employee.Position == Role);
        if (!isSuperAdmin && callerDepartmentId.HasValue)
        {
            query = query.Where(employee => employee.DepartmentId == callerDepartmentId.Value);
        }

        var entity = await query.FirstOrDefaultAsync();
        if (entity == null)
        {
            return null;
        }

        var targetDepartmentId = dto.DepartmentId ?? entity.DepartmentId;
        if (!targetDepartmentId.HasValue)
        {
            throw new InvalidOperationException("DepartmentId is required to update an employee.");
        }

        if (!isSuperAdmin && targetDepartmentId.Value != callerDepartmentId)
        {
            throw new InvalidOperationException("You are not allowed to move this admin to another department.");
        }

        var departmentName = await _context.Departments
            .Where(department => department.Id == targetDepartmentId.Value)
            .Select(department => department.Name)
            .FirstOrDefaultAsync();

        if (string.IsNullOrWhiteSpace(departmentName))
        {
            throw new InvalidOperationException("Selected department does not exist.");
        }

        entity.FirstName = dto.FirstName;
        entity.LastName = dto.LastName;
        entity.Email = dto.Email;
        entity.ProfessionalDomain = dto.ProfessionalDomain;
        entity.Seniority = dto.Seniority;
        entity.IsActive = dto.IsActive;
        entity.HireDate = dto.HireDate;
        entity.BirthDate = dto.BirthDate;
        entity.Department = departmentName;
        entity.DepartmentId = targetDepartmentId.Value;
        entity.Photo = dto.Photo;
        entity.Position = Role;

        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, int? departmentId)
    {
        var query = _context.Employees.Where(employee => employee.Id == id && employee.Position == Role);
        if (departmentId.HasValue)
        {
            query = query.Where(employee => employee.DepartmentId == departmentId.Value);
        }

        var entity = await query.FirstOrDefaultAsync();
        if (entity == null)
        {
            return false;
        }

        _context.Employees.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<AccountCreationRequestDto>> GetAccountRequestsAsync(int? departmentId)
    {
        var query = _context.AccountCreationRequests
            .Where(request => request.Employee != null);

        if (departmentId.HasValue)
        {
            query = query.Where(request => request.Employee != null && request.Employee.DepartmentId == departmentId.Value);
        }

        return await query
            .OrderByDescending(request => request.RequestedAtUtc)
            .Select(request => new AccountCreationRequestDto
            {
                Id = request.Id,
                EmployeeId = request.EmployeeId,
                Email = request.Email,
                RequestedRole = request.RequestedRole,
                TwoFactorProvider = request.TwoFactorProvider,
                Status = request.Status,
                RequestedAtUtc = request.RequestedAtUtc,
                ReviewedAtUtc = request.ReviewedAtUtc,
                ReviewedByAdminId = request.ReviewedByAdminId,
                RejectionReason = request.RejectionReason
            })
            .ToListAsync();
    }

    public async Task<List<AccountCreationRequestDto>> GetPendingAccountRequestsAsync(int? departmentId)
    {
        var query = _context.AccountCreationRequests
            .Where(request => request.Status == "Pending" && request.Employee != null);

        if (departmentId.HasValue)
        {
            query = query.Where(request => request.Employee != null && request.Employee.DepartmentId == departmentId.Value);
        }

        return await query
            .OrderBy(request => request.RequestedAtUtc)
            .Select(request => new AccountCreationRequestDto
            {
                Id = request.Id,
                EmployeeId = request.EmployeeId,
                Email = request.Email,
                RequestedRole = request.RequestedRole,
                TwoFactorProvider = request.TwoFactorProvider,
                Status = request.Status,
                RequestedAtUtc = request.RequestedAtUtc,
                ReviewedAtUtc = request.ReviewedAtUtc,
                ReviewedByAdminId = request.ReviewedByAdminId,
                RejectionReason = request.RejectionReason
            })
            .ToListAsync();
    }

    public async Task<bool> ApproveAccountRequestAsync(int requestId, int? departmentId, int? reviewerId)
    {
        var requestQuery = _context.AccountCreationRequests
            .Include(item => item.Employee)
            .Where(item => item.Id == requestId && item.Status == "Pending" && item.Employee != null);

        if (departmentId.HasValue)
        {
            requestQuery = requestQuery.Where(item => item.Employee != null && item.Employee.DepartmentId == departmentId.Value);
        }

        var request = await requestQuery.FirstOrDefaultAsync();
        if (request == null)
        {
            return false;
        }

        var employee = await _context.Employees.FirstOrDefaultAsync(item => item.Id == request.EmployeeId);
        if (employee == null)
        {
            return false;
        }

        employee.PasswordHash = request.PasswordHash;
        employee.Position = request.RequestedRole;
        employee.IsAccountApproved = true;
        employee.TwoFactorEnabled = false;
        employee.TwoFactorProvider = request.TwoFactorProvider;
        employee.GoogleAuthenticatorSecret = request.GoogleAuthenticatorSecret;

        request.Status = "Approved";
        request.ReviewedAtUtc = DateTime.UtcNow;
        request.ReviewedByAdminId = reviewerId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectAccountRequestAsync(int requestId, int? departmentId, int? reviewerId, string? reason)
    {
        var requestQuery = _context.AccountCreationRequests
            .Include(item => item.Employee)
            .Where(item => item.Id == requestId && item.Status == "Pending" && item.Employee != null);

        if (departmentId.HasValue)
        {
            requestQuery = requestQuery.Where(item => item.Employee != null && item.Employee.DepartmentId == departmentId.Value);
        }

        var request = await requestQuery.FirstOrDefaultAsync();
        if (request == null)
        {
            return false;
        }

        request.Status = "Rejected";
        request.ReviewedAtUtc = DateTime.UtcNow;
        request.ReviewedByAdminId = reviewerId;
        request.RejectionReason = reason;

        await _context.SaveChangesAsync();
        return true;
    }

    private static EmployeeDto MapToDto(Employee employee)
    {
        return new EmployeeDto
        {
            Id = employee.Id,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            Email = employee.Email,
            Position = employee.Position,
            Department = string.IsNullOrEmpty(employee.Department) ? null : new DepartmentDto { Name = employee.Department },
            ProfessionalDomain = employee.ProfessionalDomain,
            Seniority = employee.Seniority,
            IsActive = employee.IsActive,
            HireDate = employee.HireDate,
            BirthDate = employee.BirthDate,
            Photo = employee.Photo
        };
    }
}
