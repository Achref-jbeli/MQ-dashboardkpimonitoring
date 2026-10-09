using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using DashboardKpi.Api.Controllers;
using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Task;
using DashboardKpi.Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace DashboardKpi.Api.Tests;

public class DepartmentIsolationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DepartmentIsolationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetProjects_ReturnsOnlyAuthenticatedUsersDepartmentProjects()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(employeeId: 10, role: "Manager", email: "manager.a@test.local"));

        var response = await _client.GetAsync("/api/Project");

        response.EnsureSuccessStatusCode();

        var projects = (await response.Content.ReadFromJsonAsync<List<Project>>()) ?? [];

        Assert.Equal(2, projects.Count);
        Assert.All(projects, project => Assert.Equal(1, project.DepartmentId));
    }

    [Fact]
    public async Task GetProjectById_ReturnsNotFoundForDifferentDepartmentProject()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(employeeId: 10, role: "Manager", email: "manager.a@test.local"));

        var response = await _client.GetAsync("/api/Project/200");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetEvents_ReturnsOnlyAuthenticatedUsersDepartmentEvents()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(employeeId: 20, role: "Manager", email: "manager.b@test.local"));

        var response = await _client.GetAsync("/api/Event");

        response.EnsureSuccessStatusCode();

        var events = (await response.Content.ReadFromJsonAsync<List<Event>>()) ?? [];

        Assert.Single(events);
        Assert.Equal(2, events[0].DepartmentId);
    }

    [Fact]
    public async Task GetPublicDepartmentDashboard_ReturnsDepartmentScopedDataIncludingLegacyRows()
    {
        var response = await _client.GetAsync("/api/public-dashboard/departments/1");

        response.EnsureSuccessStatusCode();

        var dashboard = await response.Content.ReadFromJsonAsync<PublicDepartmentDashboardResponse>();

        Assert.NotNull(dashboard);
        Assert.Equal(1, dashboard!.Department.Id);
        Assert.Equal(2, dashboard.Projects.Count);
        Assert.Single(dashboard.Events);
        Assert.Equal(3, dashboard.Performance.TotalProjects);
        Assert.Equal(68.33m, dashboard.Performance.AverageProjectProgress);
        Assert.Equal(33.33m, dashboard.Performance.ScheduleAdherence);
        Assert.Equal(33.33m, dashboard.Performance.OverallKpiAchievement);
        Assert.Equal(3.27m, dashboard.Performance.OverallMaturity);
        Assert.Equal(3, dashboard.Employees.Count);
        Assert.Contains(dashboard.Employees, employee => employee.Id == 10);
        Assert.Contains(dashboard.Employees, employee => employee.Id == 11);
        Assert.Contains(dashboard.Employees, employee => employee.Id == 30);
        Assert.DoesNotContain(dashboard.Employees, employee => employee.Id == 20);
        Assert.Contains(dashboard.Charts.TaskStatus, slice => slice.Name == "Completed" && slice.Value == 1);
        Assert.Contains(dashboard.Charts.EmployeePerformance, item => item.Label == "Legacy Department");
    }

    [Fact]
    public async Task TeamLeaderCanCreateTaskForOwnTeamMember()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(employeeId: 30, role: "TeamLeader", email: "lead.a@test.local"));

        var response = await client.PostAsJsonAsync("/api/tasks", new AddTaskDto
        {
            Title = "Prepare June review",
            AssigneeId = 11,
            BusinessUnit = "HMI",
            DueDate = new DateTime(2026, 6, 30),
            Note = "PM follow-up"
        });

        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<TaskDto>();

        Assert.NotNull(created);
        Assert.Equal("Prepare June review", created!.Title);
        Assert.Equal(11, created.AssigneeId);
        Assert.Equal(30, created.TeamLeaderId);
        Assert.Equal("Department A", created.ResponsibleDepartment);
    }

    [Fact]
    public async Task ImportEmployeePerformanceCsv_WithoutProjectId_StoresDepartmentPerformanceUnit()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(employeeId: 10, role: "Manager", email: "manager.a@test.local"));

        const string csv = ",,,,,\n,Change No.,Description,Reason for Change,Bus. unit,MEC-Type,Description in ZLO_AEV,Plant,WBS Elem.,Responsibl,Resp_Dep,Created by,Created on,WrkIt,Tasks,User,Function,Send date,End date,Done,Init.date,Note,Days,Fwd. date\n,200001,Neuaufnahme,,HMI,20,Employee performance import,14,M/3000/01,Lead A,PM,Lead A,09.06.2026,308070,MEC-SOP Product,Legacy Department,OP2A2-TU,09.06.2026,11.06.2026,10.06.2026,09.06.2026,Imported from test,2,\n,200001,Neuaufnahme,,HMI,20,Employee performance import,14,M/3000/01,Lead A,PM,Lead A,09.06.2026,308070,MEC-SOP Produkt,Legacy Department,OP2A2-TU,09.06.2026,11.06.2026,10.06.2026,09.06.2026,Imported from test,2,";

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("PM"), "performanceUnit");
        form.Add(new StreamContent(new MemoryStream(Encoding.UTF8.GetBytes(csv)))
        {
            Headers = { ContentType = new MediaTypeHeaderValue("text/csv") }
        }, "file", "june-performance.csv");

        var response = await client.PostAsync("/api/Import/kpis/file", form);

        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<KpiImportResultDto>();

        Assert.NotNull(result);
        Assert.Null(result!.ProjectId);
        Assert.Equal("PM", result.PerformanceUnit);
        Assert.True(result.CalculatedMetrics.TryGetValue("Total Tasks", out var totalTasks));
        Assert.Equal(1m, totalTasks);
        Assert.True(result.CalculatedMetrics.TryGetValue("Completed Tasks", out var completedTasks));
        Assert.Equal(1m, completedTasks);
    }

    private static string CreateToken(int employeeId, string role, string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("DashboardKpi-Development-Key-Change-This-Now"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, employeeId.ToString()),
            new(ClaimTypes.NameIdentifier, employeeId.ToString()),
            new(ClaimTypes.Role, role),
            new(ClaimTypes.Email, email)
        };

        var token = new JwtSecurityToken(
            issuer: "DashboardKpi.Api",
            audience: "DashboardKpi.Frontend",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private sealed record PublicDepartmentDashboardResponse(
        PublicDashboardController.PublicDepartmentDto Department,
        PublicDashboardController.PublicPerformanceSummaryDto Performance,
        List<PublicDashboardController.PublicProjectDto> Projects,
        List<PublicDashboardController.PublicEventDto> Events,
        List<PublicDashboardController.PublicEmployeeDto> Employees,
        PublicDashboardController.PublicPerformanceChartsDto Charts);
}
