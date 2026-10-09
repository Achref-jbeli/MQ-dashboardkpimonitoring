using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Dtos.Department;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Services;

public class ManagerService : IManagerService
{
    private const string Role = "Administrator";
    private readonly ApplicationDbContext _context;

    public ManagerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<EmployeeDto>> GetAllAsync(int departmentId)
    {
        return await _context.Employees
            .Where(employee => employee.Position == Role && employee.DepartmentId == departmentId)
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

    public async Task<int> CreateAsync(AddEmployeeDto dto, int departmentId)
    {
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
            Department = dto.Department,
            DepartmentId = departmentId,
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

    public async Task<EmployeeDto?> UpdateAsync(int id, UpdateEmployeeDto dto, int departmentId)
    {
        var entity = await _context.Employees.FirstOrDefaultAsync(employee => employee.Id == id && employee.Position == Role && employee.DepartmentId == departmentId);
        if (entity == null)
        {
            return null;
        }

        entity.FirstName = dto.FirstName;
        entity.LastName = dto.LastName;
        entity.Email = dto.Email;
        entity.ProfessionalDomain = dto.ProfessionalDomain;
        entity.Seniority = dto.Seniority;
        entity.IsActive = dto.IsActive;
        entity.HireDate = dto.HireDate;
        entity.BirthDate = dto.BirthDate;
        entity.Department = dto.Department;
        entity.DepartmentId = departmentId;
        entity.Photo = dto.Photo;
        entity.Position = Role;

        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, int departmentId)
    {
        var entity = await _context.Employees.FirstOrDefaultAsync(employee => employee.Id == id && employee.Position == Role && employee.DepartmentId == departmentId);
        if (entity == null)
        {
            return false;
        }

        _context.Employees.Remove(entity);
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
