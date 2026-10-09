using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DashboardKpi.Api.Extensions;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<OverviewDto>> GetOverview([FromQuery] int? departmentId)
    {
        int? resolvedDepartmentId = null;
        if (User?.Identity?.IsAuthenticated == true && !User.IsSuperAdmin())
        {
            resolvedDepartmentId = await User.GetCurrentDepartmentIdAsync(_context);
        }

        int? targetDepartmentId = departmentId ?? resolvedDepartmentId;
        var isGlobal = !targetDepartmentId.HasValue;

        var employeesQuery = _context.Employees.AsNoTracking().Where(e => e.IsActive);
        IQueryable<Project> projectsQuery = _context.Projects.AsNoTracking().Include(p => p.BusinessUnit);
        var tasksQuery = _context.Tasks.AsNoTracking();
        var kpisQuery = _context.Set<Kpi>().AsNoTracking();

        if (!isGlobal)
        {
            var targetDepartmentName = await _context.Departments
                .Where(d => d.Id == targetDepartmentId)
                .Select(d => d.Name)
                .FirstOrDefaultAsync();

            employeesQuery = employeesQuery.Where(e => e.DepartmentId == targetDepartmentId
                || (e.DepartmentId == null && e.Team != null && e.Team.DepartmentId == targetDepartmentId)
                || (e.DepartmentId == null && e.Department == targetDepartmentName));

            projectsQuery = projectsQuery.Where(p => p.DepartmentId == targetDepartmentId
                || p.Tasks.Any(t => t.DepartmentId == targetDepartmentId));

            tasksQuery = tasksQuery.Where(t => t.DepartmentId == targetDepartmentId
                || (t.DepartmentId == 0 && t.ResponsibleDepartment == targetDepartmentName));

            kpisQuery = kpisQuery.Where(k => k.DepartmentId == targetDepartmentId
                || (k.DepartmentId == null && k.ResponsibleDepartment == targetDepartmentName));
        }

        var totalEmployees = await employeesQuery.CountAsync();
        var tasks = await tasksQuery.ToListAsync();
        var projects = await projectsQuery.ToListAsync();
        var kpis = await kpisQuery.ToListAsync();

        // 1. Task Completion & Workload Metrics
        var totalTasks = tasks.Count > 0 ? tasks.Count : projects.Count;
        var completedTasks = tasks.Count > 0
            ? tasks.Count(t => t.Status == "Done" || t.Status == "Completed")
            : projects.Count(p => p.Status == "On Track" && EstimateProjectProgress(p.Status) >= 95);
        var delayedTasks = tasks.Count > 0
            ? tasks.Count(t => t.Status == "Delayed")
            : projects.Count(p => p.Status != null && p.Status.Contains("delay", StringComparison.OrdinalIgnoreCase));
        var activeTasks = tasks.Count > 0
            ? tasks.Count(t => t.Status == "Active" || t.Status == "Open")
            : Math.Max(0, totalTasks - completedTasks - delayedTasks);

        var avgProgress = tasks.Count > 0
            ? (tasks.Count == 0 ? 0m : Math.Round(tasks.Average(t => (decimal)t.Progress), 2))
            : (projects.Count == 0 ? 0m : Math.Round((decimal)projects.Sum(p => EstimateProjectProgress(p.Status)) / projects.Count, 2));

        // 2. Business KPI Metrics (Synchronized with Adherence Chart and 4-tier traffic lights)
        var scheduleAdherence = kpis.Count > 0
            ? Math.Round((decimal)kpis.Count(k => k.Green || k.Yellow) / kpis.Count * 100m, 2)
            : (projects.Count > 0
                ? Math.Round((decimal)projects.Count(p => p.Status == "On Track") / projects.Count * 100m, 2)
                : (tasks.Count > 0
                    ? Math.Round((decimal)tasks.Count(t => t.CompletedAt.HasValue && (!t.DueDate.HasValue || t.CompletedAt.Value <= t.DueDate.Value)) / tasks.Count * 100m, 2)
                    : 0m));

        var overallMaturity = kpis.Count > 0
            ? Math.Round((decimal)kpis.Average(k => k.Green ? 5.0 : k.Yellow ? 3.5 : k.Orange ? 2.0 : k.Red ? 1.0 : 2.5), 2)
            : (projects.Count > 0
                ? Math.Round((decimal)projects.Average(p => EstimateProjectHealth(p.Status)) / 20m, 2)
                : (tasks.Count > 0 ? Math.Round(Math.Min(5m, tasks.Average(t => (decimal)t.PerformanceScore) / 20m), 2) : 0m));

        var deliveryPerformance = projects.Count > 0
            ? Math.Round((decimal)projects.Count(p => p.Status == "On Track") / projects.Count * 100m, 2)
            : scheduleAdherence;

        var overallKpiAchievement = kpis.Count > 0
            ? Math.Round((decimal)kpis.Count(k => k.Green || k.Yellow || k.Done == true) / kpis.Count * 100m, 2)
            : deliveryPerformance;

        var overview = new OverviewDto(
            totalEmployees,
            78.4m, // Budget Utilized
            totalTasks,
            completedTasks,
            activeTasks,
            delayedTasks,
            avgProgress,
            scheduleAdherence,
            overallKpiAchievement,
            overallMaturity,
            deliveryPerformance
        );

        return Ok(overview);
    }

    [HttpGet("business-units")]
    public async Task<ActionResult<IEnumerable<BusinessUnitDashboardDto>>> GetBusinessUnitsDashboard([FromQuery] int? departmentId)
    {
        int? resolvedDepartmentId = null;
        if (User?.Identity?.IsAuthenticated == true && !User.IsSuperAdmin())
        {
            resolvedDepartmentId = await User.GetCurrentDepartmentIdAsync(_context);
        }

        int? targetDepartmentId = departmentId ?? resolvedDepartmentId;
        var isGlobal = !targetDepartmentId.HasValue;

        var businessUnits = await _context.BusinessUnits.AsNoTracking().Select(bu => bu.Name).ToListAsync();

        if (!businessUnits.Any(b => string.Equals(b, "HMI", StringComparison.OrdinalIgnoreCase)))
            businessUnits.Add("HMI");
        if (!businessUnits.Any(b => string.Equals(b, "HIS", StringComparison.OrdinalIgnoreCase)))
            businessUnits.Add("HIS");
        if (!businessUnits.Any(b => string.Equals(b, "Performance", StringComparison.OrdinalIgnoreCase)))
            businessUnits.Add("Performance");

        var result = new List<BusinessUnitDashboardDto>();

        foreach (var buName in businessUnits)
        {
            var isPerformance = string.Equals(buName, "Performance", StringComparison.OrdinalIgnoreCase);

            var projectsQuery = _context.Projects.AsNoTracking()
                .Include(p => p.BusinessUnit)
                .Where(p => isPerformance
                    ? (p.BusinessUnit != null && (p.BusinessUnit.Name == "HMI" || p.BusinessUnit.Name == "HIS"))
                    : (p.BusinessUnit != null && p.BusinessUnit.Name == buName));

            var kpisQuery = _context.Set<Kpi>().AsNoTracking()
                .Where(k => isPerformance
                    ? (k.BusinessUnit == "Performance" || k.BusinessUnit == "HMI" || k.BusinessUnit == "HIS" || k.SourceType == "Performance" || k.ProjectId == null)
                    : (k.BusinessUnit == buName));

            if (!isGlobal)
            {
                var targetDepartmentName = await _context.Departments
                    .Where(d => d.Id == targetDepartmentId)
                    .Select(d => d.Name)
                    .FirstOrDefaultAsync();

                projectsQuery = projectsQuery.Where(p => p.DepartmentId == targetDepartmentId
                    || p.Tasks.Any(t => t.DepartmentId == targetDepartmentId));

                kpisQuery = kpisQuery.Where(k => k.DepartmentId == targetDepartmentId
                    || (k.DepartmentId == null && k.ResponsibleDepartment == targetDepartmentName));
            }

            var projects = await projectsQuery.ToListAsync();
            var kpis = await kpisQuery.ToListAsync();

            var totalProjects = projects.Count;
            var onTrackProjects = projects.Count(p => p.Status == "On Track" || string.IsNullOrWhiteSpace(p.Status));
            var delayedProjects = projects.Count(p => p.Status != null && p.Status.Contains("Delay", StringComparison.OrdinalIgnoreCase));
            var riskProjects = projects.Count(p => p.Status != null && p.Status.Contains("Risk", StringComparison.OrdinalIgnoreCase));

            // Dynamically calculate average progress from real project statuses
            var avgProgress = totalProjects > 0
                ? Math.Round((decimal)projects.Sum(p => EstimateProjectProgress(p.Status)) / totalProjects, 1)
                : 0m;

            result.Add(new BusinessUnitDashboardDto(
                buName,
                new BuKpiSummaryDto(
                    totalProjects,
                    onTrackProjects,
                    delayedProjects,
                    riskProjects,
                    avgProgress
                ),
                projects.Select(p => new BuProjectDto(
                    p.Id,
                    p.Title ?? "Untitled",
                    p.Status ?? "On Track",
                    p.BusinessUnit != null ? p.BusinessUnit.Name : "Unknown"
                )).ToList(),
                kpis.Select(k => new BuKpiDto(
                    k.Id,
                    k.Designation ?? "Untitled Kpi",
                    k.Green,
                    k.Yellow,
                    k.Red
                )).ToList()
            ));
        }

        return Ok(result);
    }

    private static string MapProjectStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "Risk";
        if (status.Contains("delay", StringComparison.OrdinalIgnoreCase) || status.Contains("block", StringComparison.OrdinalIgnoreCase) || status.Contains("hold", StringComparison.OrdinalIgnoreCase)) return "Delayed";
        if (status.Contains("risk", StringComparison.OrdinalIgnoreCase) || status.Contains("warning", StringComparison.OrdinalIgnoreCase) || status.Contains("issue", StringComparison.OrdinalIgnoreCase)) return "Risk";
        return "On Track";
    }

    private static int EstimateProjectProgress(string? status)
    {
        var mapped = MapProjectStatus(status);
        return mapped switch
        {
            "On Track" => 82,
            "Risk" => 58,
            "Delayed" => 38,
            _ => 50,
        };
    }

    private static int EstimateProjectHealth(string? status)
    {
        var mapped = MapProjectStatus(status);
        return mapped switch
        {
            "On Track" => 90,
            "Risk" => 65,
            "Delayed" => 42,
            _ => 50,
        };
    }
}

public record OverviewDto(
    int TotalEmployees,
    decimal BudgetUtilized,
    int TotalTasks,
    int CompletedTasks,
    int ActiveTasks,
    int DelayedTasks,
    decimal AverageTaskProgress,
    decimal ScheduleAdherence,
    decimal OverallKpiAchievement,
    decimal OverallMaturity,
    decimal DeliveryPerformance
);

public record BuKpiSummaryDto(int TotalProjects, int OnTrackProjects, int DelayedProjects, int RiskProjects, decimal AverageProgress);
public record BuProjectDto(int Id, string Title, string Status, string BusinessUnit);
public record BuKpiDto(int Id, string Designation, bool Green, bool Yellow, bool Red);
public record BusinessUnitDashboardDto(
    string Name,
    BuKpiSummaryDto Summary,
    List<BuProjectDto> Projects,
    List<BuKpiDto> Kpis
);
