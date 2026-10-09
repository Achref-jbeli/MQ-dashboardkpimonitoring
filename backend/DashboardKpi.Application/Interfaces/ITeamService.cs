using DashboardKpi.Application.Dtos.Team;
using DashboardKpi.Application.Dtos.Employee;

namespace DashboardKpi.Application.Interfaces;

public interface ITeamService
{
    Task<IEnumerable<TeamDto>> GetAllAsync(int? departmentId = null);
    Task<TeamDto?> GetByIdAsync(int id, int? departmentId = null);
    Task<TeamDto> CreateAsync(AddTeamDto dto, int departmentId);
    Task<TeamDto?> UpdateAsync(int id, UpdateTeamDto dto, int? departmentId = null);
    Task<TeamDto?> GetByLeaderIdAsync(int teamLeaderId, int? departmentId = null);
    Task<bool> DeleteAsync(int id, int? departmentId = null);
    Task<TeamDto?> GetMyTeamAsync(int employeeId, int? departmentId = null);
    Task<IEnumerable<EmployeeDto>> GetAvailableEmployeesAsync(int departmentId);
    Task AssignMembersAsync(int teamId, AssignMembersDto dto, int departmentId);
    Task RemoveMembersAsync(int teamId, List<int> employeeIds, int departmentId);
    Task<IEnumerable<TeamLeaderOptionDto>> GetTeamLeadersAsync(int departmentId);
}