using System.Net.Http.Headers;
using System.Net.Http.Json;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Dtos.Team;
using DashboardKpi.Application.Dtos.Employee;
using DashboardKpi.Application.Services;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using DashboardKpi.Infrastructure.Extraction;
using DashboardKpi.Infrastructure.Formula;
using DashboardKpi.Infrastructure.Normalization;
using DashboardKpi.Infrastructure.Persistence;
using DashboardKpi.Infrastructure.Persistence.Repositories;
using DashboardKpi.Infrastructure.Processing;
using DashboardKpi.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DashboardKpi.Api.Tests;

public class AdherenceKpiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AdherenceKpiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMonthlyAdherenceAsync_CalculatesGreenPlusYellowCorrectlyAndMaintainsDepartmentIsolation()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"AdherenceDb_{Guid.NewGuid()}")
            .Options;

        using var context = new ApplicationDbContext(options);

        var dept1 = 1;
        var dept2 = 2;

        // Populate Month 1: 24 Green, 64 Yellow, 5 Orange, 10 Red for Dept 1
        AddKpis(context, dept1, month: "1", greenCount: 24, yellowCount: 64, orangeCount: 5, redCount: 10);
        // Populate Month 2: 39 Green, 77 Yellow for Dept 1
        AddKpis(context, dept1, month: "2", greenCount: 39, yellowCount: 77, orangeCount: 2, redCount: 3);
        // Populate Month 3: 36 Green, 71 Yellow for Dept 1
        AddKpis(context, dept1, month: "3", greenCount: 36, yellowCount: 71, orangeCount: 0, redCount: 1);
        // Populate Month 4: 39 Green, 96 Yellow for Dept 1
        AddKpis(context, dept1, month: "4", greenCount: 39, yellowCount: 96, orangeCount: 4, redCount: 8);
        // Populate Month 5: 31 Green, 45 Yellow for Dept 1
        AddKpis(context, dept1, month: "5", greenCount: 31, yellowCount: 45, orangeCount: 1, redCount: 2);

        // Populate Dept 2 data (should never leak into Dept 1)
        AddKpis(context, dept2, month: "1", greenCount: 50, yellowCount: 50, orangeCount: 10, redCount: 10);

        await context.SaveChangesAsync();

        var translator = new FormulaTranslator();
        var formulaProcessor = new ExcelFormulaProcessor(translator);
        var normalizationService = new KpiNormalizationService(formulaProcessor);
        var kpiProcessor = new ProjectKpiProcessor(context);
        var perfProcessor = new PerformanceKpiProcessor();
        var persistenceService = new KpiPersistenceService(context);

        var orchestrator = new KpiImportOrchestrator(
            context,
            new ExcelKpiExtractor(),
            new CsvKpiExtractor(),
            new JiraKpiExtractor(new System.Net.Http.HttpClient()),
            normalizationService,
            kpiProcessor,
            perfProcessor,
            persistenceService);

        // Act - Query Dept 1
        var resultDept1 = await orchestrator.GetMonthlyAdherenceAsync(dept1);

        // Assert - 12 months (1..12) + TOTAL GÉNÉRAL = 13 items
        Assert.Equal(13, resultDept1.Count);

        // Month 1: Green 24, Yellow 64, Orange 5, Red 10 => Total 103, Adherence 88
        Assert.Equal("1", resultDept1[0].Month);
        Assert.Equal(24, resultDept1[0].GreenCount);
        Assert.Equal(64, resultDept1[0].YellowCount);
        Assert.Equal(5, resultDept1[0].OrangeCount);
        Assert.Equal(10, resultDept1[0].RedCount);
        Assert.Equal(88, resultDept1[0].AdherenceCount);
        Assert.Equal(103, resultDept1[0].TotalCount);
        Assert.Equal(23.30m, resultDept1[0].GreenPercentage);
        Assert.Equal(62.14m, resultDept1[0].YellowPercentage);
        Assert.Equal(4.85m, resultDept1[0].OrangePercentage);
        Assert.Equal(9.71m, resultDept1[0].RedPercentage);
        Assert.Equal(85.44m, resultDept1[0].AdherencePercentage);

        // Month 2: Green 39, Yellow 77, Orange 2, Red 3 => Total 121, Adherence 116
        Assert.Equal("2", resultDept1[1].Month);
        Assert.Equal(39, resultDept1[1].GreenCount);
        Assert.Equal(77, resultDept1[1].YellowCount);
        Assert.Equal(116, resultDept1[1].AdherenceCount);

        // Month 3: Green 36, Yellow 71 => Adherence 107
        Assert.Equal("3", resultDept1[2].Month);
        Assert.Equal(36, resultDept1[2].GreenCount);
        Assert.Equal(71, resultDept1[2].YellowCount);
        Assert.Equal(107, resultDept1[2].AdherenceCount);

        // Month 4: Green 39, Yellow 96 => Adherence 135
        Assert.Equal("4", resultDept1[3].Month);
        Assert.Equal(39, resultDept1[3].GreenCount);
        Assert.Equal(96, resultDept1[3].YellowCount);
        Assert.Equal(135, resultDept1[3].AdherenceCount);

        // Month 5: Green 31, Yellow 45 => Adherence 76
        Assert.Equal("5", resultDept1[4].Month);
        Assert.Equal(31, resultDept1[4].GreenCount);
        Assert.Equal(45, resultDept1[4].YellowCount);
        Assert.Equal(76, resultDept1[4].AdherenceCount);

        // Month 6 to 12: all present with 0 counts
        for (int m = 6; m <= 12; m++)
        {
            var monthItem = resultDept1[m - 1];
            Assert.Equal(m.ToString(), monthItem.Month);
            Assert.Equal(0, monthItem.GreenCount);
            Assert.Equal(0, monthItem.YellowCount);
            Assert.Equal(0, monthItem.TotalCount);
        }

        // TOTAL GÉNÉRAL: 13th item
        var grandTotal = resultDept1[12];
        Assert.Equal("TOTAL GÉNÉRAL", grandTotal.Month);
        Assert.Equal(169, grandTotal.GreenCount); // 24+39+36+39+31
        Assert.Equal(353, grandTotal.YellowCount); // 64+77+71+96+45
        Assert.Equal(12, grandTotal.OrangeCount); // 5+2+0+4+1
        Assert.Equal(24, grandTotal.RedCount); // 10+3+1+8+2
        Assert.Equal(558, grandTotal.TotalCount);
        Assert.Equal(522, grandTotal.AdherenceCount); // 169+353

        // Act - Query Dept 2
        var resultDept2 = await orchestrator.GetMonthlyAdherenceAsync(dept2);
        Assert.Equal(13, resultDept2.Count);
        Assert.Equal(50, resultDept2[0].GreenCount);
        Assert.Equal(50, resultDept2[0].YellowCount);
        Assert.Equal(100, resultDept2[0].AdherenceCount);
        Assert.Equal(41.67m, resultDept2[0].GreenPercentage);
        Assert.Equal(41.67m, resultDept2[0].YellowPercentage);
        Assert.Equal(8.33m, resultDept2[0].OrangePercentage);
        Assert.Equal(8.33m, resultDept2[0].RedPercentage);
        Assert.Equal(83.34m, resultDept2[0].AdherencePercentage);
    }

    [Fact]
    public async Task TeamService_LoadsTeamsAndTeamLeaderInformationCorrectly()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"TeamDb_{Guid.NewGuid()}")
            .Options;

        using var context = new ApplicationDbContext(options);

        var dept = new Department { Id = 10, Name = "Engineering" };
        context.Departments.Add(dept);

        var leader = new Employee
        {
            Id = 101,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@company.com",
            DepartmentId = 10,
            Role = "TeamLeader",
            Position = "Tech Lead",
            IsActive = true
        };
        var member = new Employee
        {
            Id = 102,
            FirstName = "Alice",
            LastName = "Smith",
            Email = "alice.smith@company.com",
            DepartmentId = 10,
            Role = "Employee",
            Position = "Developer",
            IsActive = true
        };
        context.Employees.AddRange(leader, member);

        var team = new Team
        {
            Id = 1,
            Name = "Core Platform",
            Description = "Main infrastructure",
            DepartmentId = 10,
            TeamLeaderId = 101
        };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        var repo = new TeamRepository(context);
        var service = new TeamService(repo);

        var teams = (await service.GetAllAsync(10)).ToList();
        Assert.Single(teams);
        Assert.Equal("Core Platform", teams[0].Name);
        Assert.Equal("Engineering", teams[0].DepartmentName);
        Assert.Equal(101, teams[0].TeamLeaderId);
        Assert.Equal("John Doe", teams[0].TeamLeaderName);
        Assert.NotNull(teams[0].TeamLeader);
        Assert.Equal("john.doe@company.com", teams[0].TeamLeader!.Email);

        var eligibleLeaders = (await service.GetTeamLeadersAsync(10)).ToList();
        Assert.Equal(2, eligibleLeaders.Count);
        Assert.Contains(eligibleLeaders, l => l.Id == 101 && l.IsAssigned);
        Assert.Contains(eligibleLeaders, l => l.Id == 102 && !l.IsAssigned);
    }

    [Fact]
    public async Task DashboardController_GetOverview_ReturnsSynchronizedKpiAdherenceAndMaturity()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"DashOverviewDb_{Guid.NewGuid()}")
            .Options;

        using var context = new ApplicationDbContext(options);

        var dept = new Department { Id = 5, Name = "Quality" };
        context.Departments.Add(dept);

        // 30 Green, 70 Yellow, 0 Orange, 0 Red => Total 100, Adherence 100%, Maturity (30*5.0 + 70*3.5)/100 = (150+245)/100 = 3.95
        AddKpis(context, deptId: 5, month: "1", greenCount: 30, yellowCount: 70, orangeCount: 0, redCount: 0);

        var proj = new Project { Id = 50, Title = "Quality Gate", DepartmentId = 5, Status = "On Track" };
        context.Projects.Add(proj);

        var task = new TaskItem { Id = 500, Title = "Review", DepartmentId = 5, Status = "Completed", Progress = 100 };
        context.Tasks.Add(task);

        await context.SaveChangesAsync();

        var controller = new Controllers.DashboardController(context);
        var actionResult = await controller.GetOverview(5);
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(actionResult.Result);
        var overview = Assert.IsType<Controllers.OverviewDto>(okResult.Value);

        Assert.Equal(100.00m, overview.ScheduleAdherence);
        Assert.Equal(3.95m, overview.OverallMaturity);
        Assert.Equal(1, overview.TotalTasks);
        Assert.Equal(1, overview.CompletedTasks);
    }

    [Fact]
    public async Task DashboardController_GetBusinessUnitsDashboard_CalculatesDynamicProgress()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"DashBuDb_{Guid.NewGuid()}")
            .Options;

        using var context = new ApplicationDbContext(options);

        var dept = new Department { Id = 6, Name = "R&D" };
        var buHmi = new BusinessUnit { Id = 1, Name = "HMI" };
        context.Departments.Add(dept);
        context.BusinessUnits.Add(buHmi);

        // 1 On Track (82%), 1 Delayed (38%) => Average = 60%
        context.Projects.AddRange(
            new Project { Id = 61, Title = "HMI Core", DepartmentId = 6, BusinessUnitId = 1, BusinessUnit = buHmi, Status = "On Track" },
            new Project { Id = 62, Title = "HMI Legacy", DepartmentId = 6, BusinessUnitId = 1, BusinessUnit = buHmi, Status = "Delayed" }
        );

        await context.SaveChangesAsync();

        var controller = new Controllers.DashboardController(context);
        var actionResult = await controller.GetBusinessUnitsDashboard(6);
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(actionResult.Result);
        var bus = Assert.IsAssignableFrom<IEnumerable<Controllers.BusinessUnitDashboardDto>>(okResult.Value).ToList();

        var hmi = bus.FirstOrDefault(b => b.Name == "HMI");
        Assert.NotNull(hmi);
        Assert.Equal(2, hmi!.Summary.TotalProjects);
        Assert.Equal(1, hmi.Summary.OnTrackProjects);
        Assert.Equal(1, hmi.Summary.DelayedProjects);
        Assert.Equal(60.0m, hmi.Summary.AverageProgress);
    }

    [Fact]
    public async Task EmployeeController_CreateEmployee_RejectsSuperAdminRole()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"EmpDb_{Guid.NewGuid()}")
            .Options;

        using var context = new ApplicationDbContext(options);
        var dept = new Department { Id = 20, Name = "HR" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var controller = new Controllers.EmployeeController(context);
        var claims = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "1"),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "Administrator"),
            new System.Security.Claims.Claim("DepartmentId", "20"),
        }, "TestAuth"));
        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = claims }
        };

        var result = await controller.CreateEmployee(new Application.Dtos.Employee.AddEmployeeDto
        {
            FirstName = "Jane",
            LastName = "Doe",
            Email = "jane.doe@company.com",
            DepartmentId = 20,
            Role = "SuperAdmin"
        });

        var badRequest = Assert.IsType<Microsoft.AspNetCore.Mvc.BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task EmployeeController_CreateEmployee_DefaultsRoleToEmployee()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"EmpDb2_{Guid.NewGuid()}")
            .Options;

        using var context = new ApplicationDbContext(options);
        var dept = new Department { Id = 21, Name = "Operations" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var controller = new Controllers.EmployeeController(context);
        var claims = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "1"),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "Administrator"),
            new System.Security.Claims.Claim("DepartmentId", "21"),
        }, "TestAuth"));
        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = claims }
        };

        var result = await controller.CreateEmployee(new Application.Dtos.Employee.AddEmployeeDto
        {
            FirstName = "Alex",
            LastName = "Mercer",
            Email = "alex.mercer@company.com",
            DepartmentId = 21,
            Role = ""
        });

        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var created = Assert.IsType<Application.Dtos.Employee.EmployeeDto>(okResult.Value);
        Assert.Equal("Employee", created.Role);
        Assert.Equal("Alex", created.FirstName);
        Assert.Equal("Mercer", created.LastName);
        Assert.Equal("alex.mercer@company.com", created.Email);
    }

    [Fact]
    public async Task PublicDashboard_AdherenceEndpoint_ReturnsMonthlyData()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/public-dashboard/departments/1/adherence-to-schedule");

        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadFromJsonAsync<List<MonthlyAdherenceDto>>();
        Assert.NotNull(items);
    }

    [Fact]
    public async Task KpiController_AdherenceEndpoint_RequiresAuthentication()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/kpi/adherence-to-schedule");

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static void AddKpis(ApplicationDbContext context, int deptId, string month, int greenCount, int yellowCount, int orangeCount, int redCount)
    {
        for (int i = 0; i < greenCount; i++)
        {
            context.Set<Kpi>().Add(new Kpi
            {
                DepartmentId = deptId,
                Month = month,
                Green = true,
                Yellow = false,
                Orange = false,
                Red = false,
                SourceType = "Excel",
                WorkItem = $"Rec-G-{deptId}-{month}-{i}",
                CalculatedAtUtc = DateTime.UtcNow
            });
        }

        for (int i = 0; i < yellowCount; i++)
        {
            context.Set<Kpi>().Add(new Kpi
            {
                DepartmentId = deptId,
                Month = month,
                Green = false,
                Yellow = true,
                Orange = false,
                Red = false,
                SourceType = "Excel",
                WorkItem = $"Rec-Y-{deptId}-{month}-{i}",
                CalculatedAtUtc = DateTime.UtcNow
            });
        }

        for (int i = 0; i < orangeCount; i++)
        {
            context.Set<Kpi>().Add(new Kpi
            {
                DepartmentId = deptId,
                Month = month,
                Green = false,
                Yellow = false,
                Orange = true,
                Red = false,
                SourceType = "Excel",
                WorkItem = $"Rec-O-{deptId}-{month}-{i}",
                CalculatedAtUtc = DateTime.UtcNow
            });
        }

        for (int i = 0; i < redCount; i++)
        {
            context.Set<Kpi>().Add(new Kpi
            {
                DepartmentId = deptId,
                Month = month,
                Green = false,
                Yellow = false,
                Orange = false,
                Red = true,
                SourceType = "Excel",
                WorkItem = $"Rec-R-{deptId}-{month}-{i}",
                CalculatedAtUtc = DateTime.UtcNow
            });
        }
    }
}
