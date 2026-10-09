using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Persistence.Repositories;

public class TeamRepository : ITeamRepository
{
    private readonly ApplicationDbContext _context;

    public TeamRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Employee>> GetTeamLeadersAsync(int departmentId, int? excludeTeamId = null)
    {
        return await _context.Employees
            .Where(e => e.DepartmentId == departmentId && e.IsActive)
            .OrderBy(e => e.FirstName)
            .ThenBy(e => e.LastName)
            .ToListAsync();
    }

    public async Task<Dictionary<int, (int TeamId, string TeamName)>> GetTeamLeaderAssignmentsAsync(int departmentId)
    {
        return await _context.Teams
            .Where(t => t.DepartmentId == departmentId && t.TeamLeaderId > 0)
            .Select(t => new { TeamLeaderId = t.TeamLeaderId, t.Id, t.Name })
            .ToDictionaryAsync(x => x.TeamLeaderId, x => (x.Id, x.Name));
    }

    public async Task<Team?> GetByLeaderIdAsync(int teamLeaderId, int? departmentId = null)
    {
        var query = _context.Teams
            .Include(t => t.Department)
            .Include(t => t.TeamLeader)
            .Include(t => t.Employees)
            .Where(t => t.TeamLeaderId == teamLeaderId);

        if (departmentId.HasValue)
        {
            query = query.Where(t => t.DepartmentId == departmentId.Value);
        }

        return await query.FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Team>> GetAllAsync(int? departmentId = null)
    {
        var query = _context.Teams
            .Include(t => t.Department)
                .ThenInclude(d => d.BusinessUnit)
            .Include(t => t.TeamLeader)
            .Include(t => t.Employees)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(t => t.DepartmentId == departmentId.Value);
        }

        return await query.OrderBy(t => t.Name).ToListAsync();
    }

    public async Task<Team?> GetByIdAsync(int id, int? departmentId = null)
    {
        var query = _context.Teams
            .Include(t => t.Department)
                .ThenInclude(d => d.BusinessUnit)
            .Include(t => t.TeamLeader)
            .Include(t => t.Employees)
            .Where(t => t.Id == id);

        if (departmentId.HasValue)
        {
            query = query.Where(t => t.DepartmentId == departmentId.Value);
        }

        return await query.FirstOrDefaultAsync();
    }

    public async Task AddAsync(Team team)
    {
        await _context.Teams.AddAsync(team);
    }

    public void Update(Team team)
    {
        _context.Teams.Update(team);
    }

    public void Delete(Team team)
    {
        _context.Teams.Remove(team);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<List<Employee>> GetAvailableEmployeesAsync(int departmentId)
    {
        return await _context.Employees
            .Where(e => e.TeamId == null && e.DepartmentId == departmentId && e.IsActive)
            .OrderBy(e => e.FirstName)
            .ThenBy(e => e.LastName)
            .ToListAsync();
    }

    public async Task<List<Employee>> GetEmployeesByIdsAsync(IEnumerable<int> ids, int departmentId)
    {
        return await _context.Employees
            .Where(e => ids.Contains(e.Id) && e.DepartmentId == departmentId)
            .ToListAsync();
    }

    public async Task<Employee?> GetEmployeeByIdAsync(int id, int? departmentId = null)
    {
        var query = _context.Employees.Where(e => e.Id == id);
        if (departmentId.HasValue)
        {
            query = query.Where(e => e.DepartmentId == departmentId.Value);
        }
        return await query.FirstOrDefaultAsync();
    }
}