using System.ComponentModel.DataAnnotations;
using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Dtos.Department;




namespace DashboardKpi.Application.Dtos.Team;

public class AssignMembersDto
{
    public List<int> EmployeeIds { get; set; } = new();
}