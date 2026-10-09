using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface ITeamRepository
{
    Task<Team?> GetByLeaderIdAsync(int teamLeaderId, int? departmentId = null);
    Task<List<Employee>> GetTeamLeadersAsync(int departmentId, int? excludeTeamId = null);
    Task<Dictionary<int, (int TeamId, string TeamName)>> GetTeamLeaderAssignmentsAsync(int departmentId);
    Task<IEnumerable<Team>> GetAllAsync(int? departmentId = null);
    Task<Team?> GetByIdAsync(int id, int? departmentId = null);
    Task AddAsync(Team team);
    void Update(Team team);
    void Delete(Team team);
    Task SaveChangesAsync();
    Task<List<Employee>> GetAvailableEmployeesAsync(int departmentId);
    Task<List<Employee>> GetEmployeesByIdsAsync(IEnumerable<int> ids, int departmentId);
    Task<Employee?> GetEmployeeByIdAsync(int id, int? departmentId = null);
}