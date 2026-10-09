using DashboardKpi.Application.Dtos.Employee;

namespace DashboardKpi.Application.Interfaces;

public interface IAdminService
{
    Task<List<EmployeeDto>> GetAllAsync(int? departmentId);
    Task<int> CreateAsync(AddEmployeeDto dto, int? departmentId);
    Task<EmployeeDto?> UpdateAsync(int id, UpdateEmployeeDto dto, int? callerDepartmentId, bool isSuperAdmin);
    Task<bool> DeleteAsync(int id, int? departmentId);

    Task<List<AccountCreationRequestDto>> GetAccountRequestsAsync(int? departmentId);
    Task<List<AccountCreationRequestDto>> GetPendingAccountRequestsAsync(int? departmentId);
    Task<bool> ApproveAccountRequestAsync(int requestId, int? departmentId, int? reviewerId);
    Task<bool> RejectAccountRequestAsync(int requestId, int? departmentId, int? reviewerId, string? reason);
}