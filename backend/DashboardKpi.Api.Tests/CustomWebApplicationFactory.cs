using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DashboardKpi.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"DashboardKpiTestsDb-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            var provider = services.BuildServiceProvider();

            using var scope = provider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            SeedData(context);
        });
    }

    private static void SeedData(ApplicationDbContext context)
    {
        var depA = new Department { Id = 1, Name = "Department A" };
        var depB = new Department { Id = 2, Name = "Department B" };

        context.Departments.AddRange(depA, depB);

        var managerA = new Employee
        {
            Id = 10,
            FirstName = "Manager",
            LastName = "A",
            Email = "manager.a@test.local",
            Department = depA.Name,
            DepartmentId = depA.Id,
            Role = "Manager",
            Position = "Manager",
            IsActive = true,
            IsAccountApproved = true,
            TwoFactorEnabled = false
        };

        var legacyEmployee = new Employee
        {
            Id = 11,
            FirstName = "Legacy",
            LastName = "Department",
            Email = "legacy.department@test.local",
            Department = depA.Name,
            DepartmentId = null,
            Role = "Engineer",
            Position = "Engineer",
            IsActive = true,
            IsAccountApproved = true,
            TwoFactorEnabled = false
        };

        var teamLeaderA = new TeamLeader
        {
            Id = 30,
            FirstName = "Lead",
            LastName = "A",
            Email = "lead.a@test.local",
            Department = depA.Name,
            DepartmentId = depA.Id,
            Role = "TeamLeader",
            Position = "TeamLeader",
            IsActive = true,
            IsAccountApproved = true,
            TwoFactorEnabled = false
        };

        var managerB = new Employee
        {
            Id = 20,
            FirstName = "Manager",
            LastName = "B",
            Email = "manager.b@test.local",
            Department = depB.Name,
            DepartmentId = depB.Id,
            Role = "Manager",
            Position = "Manager",
            IsActive = true,
            IsAccountApproved = true,
            TwoFactorEnabled = false
        };

        context.Employees.AddRange(managerA, legacyEmployee, teamLeaderA, managerB);

        context.Teams.Add(
            new Team
            {
                Id = 700,
                Name = "PM Team A",
                DepartmentId = depA.Id,
                TeamLeaderId = 30
            });

        legacyEmployee.TeamId = 700;

        var buHmi = new BusinessUnit { Id = 1, Name = "HMI" };
        var buHis = new BusinessUnit { Id = 2, Name = "HIS" };
        context.BusinessUnits.AddRange(buHmi, buHis);

        context.Projects.AddRange(
            new Project
            {
                Id = 100,
                Title = "Project A1",
                BusinessUnit = buHmi,
                BusinessUnitId = buHmi.Id,
                DepartmentId = depA.Id,
                Status = "Active"
            },
            new Project
            {
                Id = 101,
                Title = "Project A2",
                BusinessUnit = buHis,
                BusinessUnitId = buHis.Id,
                DepartmentId = depA.Id,
                Status = "Active"
            },
            new Project
            {
                Id = 200,
                Title = "Project B1",
                BusinessUnit = buHmi,
                BusinessUnitId = buHmi.Id,
                DepartmentId = depB.Id,
                Status = "Active"
            }
        );

        context.Events.AddRange(
            new Event
            {
                Id = 300,
                Title = "Event A",
                DepartmentId = depA.Id,
                Type = "meeting"
            },
            new Event
            {
                Id = 400,
                Title = "Event B",
                DepartmentId = depB.Id,
                Type = "meeting"
            }
        );

        context.Set<Kpi>().AddRange(
            new Kpi
            {
                Id = 500,
                DepartmentId = depA.Id,
                ResponsibleDepartment = depA.Name,
                Done = true,
                AdherenceToSchedule = 88m,
                Green = true
            },
            new Kpi
            {
                Id = 501,
                DepartmentId = null,
                ResponsibleDepartment = depA.Name,
                Done = false,
                AdherenceToSchedule = 40m,
                Yellow = true
            },
            new Kpi
            {
                Id = 600,
                DepartmentId = depB.Id,
                ResponsibleDepartment = depB.Name,
                Done = true,
                AdherenceToSchedule = 72m,
                Green = true
            }
        );

        context.Tasks.AddRange(
            new TaskItem
            {
                Id = 800,
                Title = "MEC-SOP Product",
                DepartmentId = depA.Id,
                TeamId = 700,
                ProjectId = 100,
                TeamLeaderId = 30,
                AssigneeId = 11,
                AssigneeName = "Legacy Department",
                ResponsibleName = "Lead A",
                ResponsibleDepartment = "PM",
                BusinessUnit = "HMI",
                Status = "Completed",
                Progress = 100,
                PerformanceScore = 96,
                SendDate = new DateTime(2026, 6, 9),
                DueDate = new DateTime(2026, 6, 11),
                CompletedAt = new DateTime(2026, 6, 10),
                SourceMonth = "2026-06"
            },
            new TaskItem
            {
                Id = 801,
                Title = "MEC-SOP Product",
                DepartmentId = depA.Id,
                TeamId = 700,
                ProjectId = 101,
                TeamLeaderId = 30,
                AssigneeId = 11,
                AssigneeName = "Legacy Department",
                ResponsibleName = "Lead A",
                ResponsibleDepartment = "PM",
                BusinessUnit = "HMI",
                Status = "Delayed",
                Progress = 35,
                PerformanceScore = 32,
                SendDate = new DateTime(2026, 6, 15),
                DueDate = new DateTime(2026, 6, 22),
                CompletedAt = null,
                SourceMonth = "2026-06"
            },
            new TaskItem
            {
                Id = 802,
                Title = "MEC-SOP Product",
                DepartmentId = depA.Id,
                TeamId = 700,
                ProjectId = 101,
                TeamLeaderId = 30,
                AssigneeId = 10,
                AssigneeName = "Manager A",
                ResponsibleName = "Lead A",
                ResponsibleDepartment = "PM",
                BusinessUnit = "HMI",
                Status = "Active",
                Progress = 70,
                PerformanceScore = 68,
                SendDate = new DateTime(2026, 6, 22),
                DueDate = new DateTime(2026, 6, 26),
                CompletedAt = null,
                SourceMonth = "2026-06"
            },
            new TaskItem
            {
                Id = 900,
                Title = "Other department task",
                DepartmentId = depB.Id,
                AssigneeId = 20,
                AssigneeName = "Manager B",
                ResponsibleDepartment = "QA",
                Status = "Completed",
                Progress = 100,
                PerformanceScore = 90,
                SendDate = new DateTime(2026, 6, 1),
                DueDate = new DateTime(2026, 6, 2),
                CompletedAt = new DateTime(2026, 6, 2),
                SourceMonth = "2026-06"
            }
        );

        context.SaveChanges();
    }
}
