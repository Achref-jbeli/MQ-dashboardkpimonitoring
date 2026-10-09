using DashboardKpi.Application.Dtos.Employee;

namespace DashboardKpi.Application.Interfaces;

public interface IManagerService
{
    Task<List<EmployeeDto>> GetAllAsync(int departmentId);
    Task<int> CreateAsync(AddEmployeeDto dto, int departmentId);
    Task<EmployeeDto?> UpdateAsync(int id, UpdateEmployeeDto dto, int departmentId);
    Task<bool> DeleteAsync(int id, int departmentId);
}