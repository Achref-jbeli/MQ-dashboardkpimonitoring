using DashboardKpi.Application.Dtos.Team;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Dtos.Department;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Services;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _repository;

    public TeamService(ITeamRepository repository)
    {
        _repository = repository;
    }

    private static TeamDto MapToDto(Team team)
    {
        return new TeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Description = team.Description,
            DepartmentId = team.DepartmentId,
            DepartmentName = team.Department?.Name ?? string.Empty,
            Department = team.Department == null ? null : new DepartmentDto
            {
                Id = team.Department.Id,
                Name = team.Department.Name
            },
            TeamLeaderId = team.TeamLeaderId,
            TeamLeaderName = team.TeamLeader == null
                ? string.Empty
                : $"{team.TeamLeader.FirstName} {team.TeamLeader.LastName}".Trim(),
            TeamLeader = team.TeamLeader == null ? null : new EmployeeDto
            {
                Id = team.TeamLeader.Id,
                FirstName = team.TeamLeader.FirstName,
                LastName = team.TeamLeader.LastName,
                Email = team.TeamLeader.Email,
                Position = team.TeamLeader.Position,
                Role = team.TeamLeader.Role,
                DepartmentId = team.TeamLeader.DepartmentId,
                DepartmentName = team.Department?.Name,
                ProfessionalDomain = team.TeamLeader.ProfessionalDomain,
                Seniority = team.TeamLeader.Seniority,
                IsActive = team.TeamLeader.IsActive,
                Photo = team.TeamLeader.Photo
            },
            Employees = team.Employees.Select(e => new EmployeeDto
            {
                Id = e.Id,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Position = e.Position,
                Role = e.Role,
                DepartmentId = e.DepartmentId,
                TeamId = e.TeamId,
                TeamName = team.Name,
                ProfessionalDomain = e.ProfessionalDomain,
                Seniority = e.Seniority,
                IsActive = e.IsActive,
                Photo = e.Photo
            }).ToList()
        };
    }

    public async Task<TeamDto?> GetByLeaderIdAsync(int teamLeaderId, int? departmentId = null)
    {
        var team = await _repository.GetByLeaderIdAsync(teamLeaderId, departmentId);
        return team == null ? null : MapToDto(team);
    }

    public async Task<IEnumerable<TeamDto>> GetAllAsync(int? departmentId = null)
    {
        var teams = await _repository.GetAllAsync(departmentId);
        return teams.Select(MapToDto).ToList();
    }

    public async Task<TeamDto?> GetByIdAsync(int id, int? departmentId = null)
    {
        var team = await _repository.GetByIdAsync(id, departmentId);
        return team == null ? null : MapToDto(team);
    }

    public async Task<TeamDto> CreateAsync(AddTeamDto dto, int departmentId)
    {
        var targetDepartmentId = dto.DepartmentId > 0 ? dto.DepartmentId : departmentId;
        var teamLeader = await _repository.GetEmployeeByIdAsync(dto.TeamLeaderId, targetDepartmentId);

        if (teamLeader == null)
        {
            throw new Exception("Team leader not found in the selected department");
        }

        var team = new Team
        {
            Name = dto.Name,
            Description = dto.Description,
            DepartmentId = targetDepartmentId,
            TeamLeaderId = dto.TeamLeaderId
        };

        await _repository.AddAsync(team);
        await _repository.SaveChangesAsync();

        var created = await _repository.GetByIdAsync(team.Id, targetDepartmentId);
        return created != null ? MapToDto(created) : MapToDto(team);
    }

    public async Task<TeamDto?> UpdateAsync(int id, UpdateTeamDto dto, int? departmentId = null)
    {
        var team = await _repository.GetByIdAsync(id, departmentId);
        if (team == null)
            return null;

        var targetDepartmentId = dto.DepartmentId > 0 ? dto.DepartmentId : team.DepartmentId;

        if (dto.TeamLeaderId > 0 && dto.TeamLeaderId != team.TeamLeaderId)
        {
            var leader = await _repository.GetEmployeeByIdAsync(dto.TeamLeaderId, targetDepartmentId);
            if (leader == null)
            {
                throw new Exception("Selected team leader does not belong to this department");
            }
            team.TeamLeaderId = dto.TeamLeaderId;
        }

        team.Name = dto.Name;
        team.Description = dto.Description;
        team.DepartmentId = targetDepartmentId;

        _repository.Update(team);
        await _repository.SaveChangesAsync();

        var updated = await _repository.GetByIdAsync(id, targetDepartmentId);
        return updated != null ? MapToDto(updated) : MapToDto(team);
    }

    public async Task<bool> DeleteAsync(int id, int? departmentId = null)
    {
        var team = await _repository.GetByIdAsync(id, departmentId);
        if (team == null)
            return false;

        _repository.Delete(team);
        await _repository.SaveChangesAsync();
        return true;
    }

    public async Task<TeamDto?> GetMyTeamAsync(int employeeId, int? departmentId = null)
    {
        var team = await _repository.GetByLeaderIdAsync(employeeId, departmentId);
        return team == null ? null : MapToDto(team);
    }

    public async Task<IEnumerable<EmployeeDto>> GetAvailableEmployeesAsync(int departmentId)
    {
        var employees = await _repository.GetAvailableEmployeesAsync(departmentId);

        return employees.Select(e => new EmployeeDto
        {
            Id = e.Id,
            FirstName = e.FirstName,
            LastName = e.LastName,
            Email = e.Email,
            Role = e.Role,
            DepartmentId = e.DepartmentId,
            ProfessionalDomain = e.ProfessionalDomain,
            Position = e.Position,
            IsActive = e.IsActive,
            Photo = e.Photo
        }).ToList();
    }

    public async Task AssignMembersAsync(int teamId, AssignMembersDto dto, int departmentId)
    {
        var employees = await _repository.GetEmployeesByIdsAsync(dto.EmployeeIds, departmentId);

        foreach (var employee in employees)
        {
            employee.TeamId = teamId;
        }

        await _repository.SaveChangesAsync();
    }

    public async Task RemoveMembersAsync(int teamId, List<int> employeeIds, int departmentId)
    {
        var employees = await _repository.GetEmployeesByIdsAsync(employeeIds, departmentId);

        foreach (var employee in employees)
        {
            employee.TeamId = null;
        }

        await _repository.SaveChangesAsync();
    }

    public async Task<IEnumerable<TeamLeaderOptionDto>> GetTeamLeadersAsync(int departmentId)
    {
        var leaders = await _repository.GetTeamLeadersAsync(departmentId);
        var assignments = await _repository.GetTeamLeaderAssignmentsAsync(departmentId);

        return leaders.Select(e =>
        {
            var isAssigned = assignments.TryGetValue(e.Id, out var assignment);

            return new TeamLeaderOptionDto
            {
                Id = e.Id,
                FirstName = e.FirstName,
                LastName = e.LastName,
                ProfessionalDomain = e.ProfessionalDomain,
                Position = e.Position,
                IsAssigned = isAssigned,
                AssignedTeamId = isAssigned ? assignment.TeamId : null,
                AssignedTeamName = isAssigned ? assignment.TeamName : null
            };
        }).ToList();
    }
}