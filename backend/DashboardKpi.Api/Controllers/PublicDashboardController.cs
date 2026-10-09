using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Dtos.Milestone;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/public-dashboard")]
[Route("api/PublicDashboard")]
[AllowAnonymous]
public class PublicDashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IKpiImportOrchestrator _kpiOrchestrator;
    private readonly IKpiImportService _kpiImportService;

    public PublicDashboardController(
        ApplicationDbContext context,
        IKpiImportOrchestrator kpiOrchestrator,
        IKpiImportService kpiImportService)
    {
        _context = context;
        _kpiOrchestrator = kpiOrchestrator;
        _kpiImportService = kpiImportService;
    }

    [HttpGet("departments/{departmentId:int}/adherence-to-schedule")]
    [HttpGet("departments/{departmentId:int}/adherence")]
    public async Task<ActionResult<IReadOnlyList<MonthlyAdherenceDto>>> GetDepartmentAdherenceToSchedule(
        int departmentId,
        [FromQuery] int? projectId = null,
        [FromQuery] string? businessUnit = null,
        [FromQuery] int? year = null,
        [FromQuery] string? responsibleDepartments = null,
        CancellationToken cancellationToken = default)
    {
        var respDepts = string.IsNullOrWhiteSpace(responsibleDepartments)
            ? null
            : responsibleDepartments.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                    .ToList();

        var results = await _kpiImportService.GetMonthlyAdherenceAsync(
            departmentId,
            projectId,
            businessUnit,
            year,
            respDepts,
            cancellationToken);

        return Ok(results);
    }

    [HttpGet("departments/{departmentId:int}/kpis/adherence-to-schedule/monthly")]
    public async Task<IActionResult> GetDepartmentMonthlyAdherenceStacked(
        int departmentId,
        [FromQuery] int? projectId = null,
        [FromQuery] string? businessUnit = null,
        [FromQuery] int? year = null,
        [FromQuery] string? responsibleDepartments = null,
        CancellationToken cancellationToken = default)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == departmentId, cancellationToken);

        if (department == null)
        {
            return NotFound(new { message = "Department not found." });
        }

        var respDepts = string.IsNullOrWhiteSpace(responsibleDepartments)
            ? null
            : responsibleDepartments.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                    .ToList();

        var results = await _kpiImportService.GetMonthlyAdherenceAsync(
            departmentId,
            projectId,
            businessUnit,
            year,
            respDepts,
            cancellationToken);

        var monthItems = results
            .Where(r => r.Month != "TOTAL GÉNÉRAL")
            .Select(r => new
            {
                month = r.Month,
                green = r.GreenCount,
                yellow = r.YellowCount,
                orange = r.OrangeCount,
                red = r.RedCount,
                total = r.TotalCount,
                greenPercentage = r.GreenPercentage,
                yellowPercentage = r.YellowPercentage,
                orangePercentage = r.OrangePercentage,
                redPercentage = r.RedPercentage,
                adherencePercentage = r.AdherencePercentage,
            })
            .ToList();

        return Ok(new
        {
            departmentId = department.Id,
            departmentName = department.Name,
            kpi = "ADHERENCE_TO_SCHEDULE",
            months = monthItems
        });
    }

    [HttpGet("departments")]
    public async Task<ActionResult<IReadOnlyList<PublicDepartmentDto>>> GetDepartments()
    {
        var departments = await _context.Departments
            .AsNoTracking()
            .OrderBy(department => department.Name)
            .Select(department => new PublicDepartmentDto(
                department.Id,
                department.Name,
                department.BusinessUnit != null ? department.BusinessUnit.Name : null))
            .ToListAsync();

        return Ok(departments);
    }

    [HttpGet("departments/{departmentId:int}")]
    public async Task<ActionResult<PublicDepartmentDashboardDto>> GetDepartmentDashboard(int departmentId)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .Where(item => item.Id == departmentId)
            .Select(item => new PublicDepartmentDto(
                item.Id,
                item.Name,
                item.BusinessUnit != null ? item.BusinessUnit.Name : null))
            .FirstOrDefaultAsync();

        if (department == null)
        {
            return NotFound(new { message = "Department not found." });
        }

        var departmentName = department.Name;

        var rawProjects = await _context.Projects
            .AsNoTracking()
            .Include(project => project.BusinessUnit)
            .Where(project => project.DepartmentId == departmentId || project.Tasks.Any(t => t.DepartmentId == departmentId))
            .OrderBy(project => project.Title)
            .ToListAsync();

        var projects = rawProjects.Select(project => new PublicProjectDto(
            project.Id,
            project.Title ?? "Untitled",
            MapProjectStatus(project.Status),
            EstimateProjectProgress(project.Status),
            project.BusinessUnit != null ? project.BusinessUnit.Name : "Unknown",
            "-",
            project.EndDate,
            EstimateProjectHealth(project.Status)))
            .ToList();

        var events = await _context.Events
            .AsNoTracking()
            .OrderBy(item => item.Date)
            .Select(item => new PublicEventDto(
                item.Id,
                item.Title,
                item.Description,
                item.Date,
                item.Location,
                item.Type,
                item.EmployeeId,
                item.ImageUrl))
            .ToListAsync();

        var employees = await _context.Employees
            .AsNoTracking()
            .Where(employee => employee.DepartmentId == departmentId
                || (employee.DepartmentId == null && employee.Team != null && employee.Team.DepartmentId == departmentId)
                || (employee.DepartmentId == null && employee.Department == departmentName))
            .OrderBy(employee => employee.FirstName)
            .ThenBy(employee => employee.LastName)
            .Select(employee => new PublicEmployeeDto(
                employee.Id,
                employee.FirstName,
                employee.LastName,
                employee.ProfessionalDomain,
                employee.Seniority,
                employee.Department ?? departmentName,
                employee.Role,
                employee.BirthDate,
                employee.IsActive,
                employee.Position,
                employee.HireDate,
                employee.TeamId,
                employee.Photo))
            .ToListAsync();

        var kpis = await _context.Set<Kpi>()
            .AsNoTracking()
            .Where(kpi => kpi.DepartmentId == departmentId
                || (kpi.DepartmentId == null && kpi.ResponsibleDepartment == departmentName))
            .ToListAsync();

        var tasks = await _context.Tasks
            .AsNoTracking()
            .Where(task => task.DepartmentId == departmentId
                || (task.DepartmentId == 0 && task.ResponsibleDepartment == departmentName))
            .OrderByDescending(task => task.CreatedOn ?? task.SendDate)
            .ToListAsync();

        var summary = tasks.Count > 0
            ? BuildTaskSummary(tasks, kpis)
            : BuildProjectSummary(projects, kpis);

        var charts = tasks.Count > 0
            ? BuildTaskCharts(tasks)
            : BuildProjectCharts(projects);

        var mergedEvents = events.ToList();
        foreach (var emp in employees)
        {
            if (emp.BirthDate.HasValue)
            {
                var today = DateTime.UtcNow;
                var bdayThisYear = new DateTime(today.Year, emp.BirthDate.Value.Month, emp.BirthDate.Value.Day);
                mergedEvents.Add(new PublicEventDto(
                    0,
                    $"{emp.FirstName} {emp.LastName}'s Birthday",
                    "Birthday celebration",
                    bdayThisYear,
                    null,
                    "Birthday",
                    emp.Id
                ));
            }
        }
        mergedEvents = mergedEvents.OrderBy(e => e.Date).ToList();

        return Ok(new PublicDepartmentDashboardDto(
            department,
            summary,
            projects,
            mergedEvents,
            employees,
            charts));
    }

    [HttpGet("departments/{departmentId:int}/international-business")]
    public async Task<ActionResult<IReadOnlyList<PublicInternationalBusinessDto>>> GetInternationalBusinesses(int departmentId)
    {
        var departmentExists = await _context.Departments
            .AsNoTracking()
            .AnyAsync(item => item.Id == departmentId);

        if (!departmentExists)
        {
            return NotFound(new { message = "Department not found." });
        }

        var raw = await _context.InternationalBusinesses
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .ToListAsync();

        var internationalBusinesses = raw.Select(item => new PublicInternationalBusinessDto(
            item.Id,
            item.Name ?? string.Empty,
            item.Country,
            item.PartnerName,
            item.Description,
            item.Photos ?? new List<string>(),
            item.IsNewBusiness,
            item.ProjectInfo,
            item.VolumeLifetime,
            item.SalesLifetime,
            item.Sop,
            item.ProductionLocation,
            item.UpdatedAtUtc)).ToList();

        return Ok(internationalBusinesses);
    }

    [HttpGet("departments/{departmentId:int}/pep-milestones")]
    public async Task<ActionResult<PepMilestoneDistributionDto>> GetDepartmentPepMilestones(
        int departmentId,
        [FromQuery] int? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var departmentExists = await _context.Departments
            .AsNoTracking()
            .AnyAsync(d => d.Id == departmentId, cancellationToken);

        if (!departmentExists)
        {
            return NotFound(new { message = "Department not found." });
        }

        var query = _context.Milestones
            .AsNoTracking()
            .Include(m => m.Project)
            .AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(m => m.ProjectId == projectId.Value);
        }

        var milestones = await query
            .OrderBy(m => m.PlannedDate)
            .ToListAsync(cancellationToken);

        var total = milestones.Count;
        var onTimeCount = 0;
        var delay2To4wCount = 0;
        var delayMoreThan4wCount = 0;
        var openCount = 0;
        var completedCount = 0;
        var delayDaysList = new List<double>();
        var items = new List<PepMilestoneItemDto>();

        foreach (var m in milestones)
        {
            var isCompleted = m.ActualDate.HasValue || string.Equals(m.Status, "Completed", StringComparison.OrdinalIgnoreCase);

            string category;
            int? delayDays = null;

            if (!isCompleted || !m.ActualDate.HasValue)
            {
                category = "Open";
                openCount++;
                if (m.PlannedDate.HasValue && m.PlannedDate.Value < DateTime.UtcNow)
                {
                    delayDays = (int)(DateTime.UtcNow.Date - m.PlannedDate.Value.Date).TotalDays;
                }
            }
            else
            {
                completedCount++;
                if (m.PlannedDate.HasValue)
                {
                    var delay = (m.ActualDate.Value.Date - m.PlannedDate.Value.Date).TotalDays;
                    delayDays = (int)Math.Max(0, delay);
                    delayDaysList.Add(delay);

                    if (delay <= 14)
                    {
                        category = "On time / ≤ 2w";
                        onTimeCount++;
                    }
                    else if (delay <= 28)
                    {
                        category = "Delay 2–4w";
                        delay2To4wCount++;
                    }
                    else
                    {
                        category = "Delay > 4w";
                        delayMoreThan4wCount++;
                    }
                }
                else
                {
                    category = "On time / ≤ 2w";
                    onTimeCount++;
                }
            }

            items.Add(new PepMilestoneItemDto
            {
                Id = m.Id,
                Name = m.Name,
                ProjectId = m.ProjectId,
                ProjectTitle = m.Project?.Title ?? "Untitled Project",
                PlannedDate = m.PlannedDate,
                ActualDate = m.ActualDate,
                Category = category,
                DelayDays = delayDays ?? m.DelayDays,
                Status = m.Status,
                Responsible = m.Responsible
            });
        }

        var uniqueProjects = milestones.Select(m => m.ProjectId).Distinct().Count();
        var avgDelay = delayDaysList.Count > 0 ? Math.Round((decimal)delayDaysList.Average(), 1) : 0m;
        var completionRate = total > 0 ? Math.Round((decimal)completedCount / total * 100m, 1) : 0m;

        var result = new PepMilestoneDistributionDto
        {
            TotalCount = total,
            OnTimeCount = onTimeCount,
            Delay2To4WeeksCount = delay2To4wCount,
            DelayMoreThan4WeeksCount = delayMoreThan4wCount,
            OpenCount = openCount,
            OnTimePercentage = total > 0 ? Math.Round((decimal)onTimeCount / total * 100m, 1) : 0m,
            Delay2To4WeeksPercentage = total > 0 ? Math.Round((decimal)delay2To4wCount / total * 100m, 1) : 0m,
            DelayMoreThan4WeeksPercentage = total > 0 ? Math.Round((decimal)delayMoreThan4wCount / total * 100m, 1) : 0m,
            OpenPercentage = total > 0 ? Math.Round((decimal)openCount / total * 100m, 1) : 0m,
            TotalProjects = uniqueProjects,
            TotalMilestones = total,
            CompletedMilestones = completedCount,
            OpenMilestones = openCount,
            CompletionRate = completionRate,
            AverageDelayDays = avgDelay,
            Items = items
        };

        return Ok(result);
    }

    [HttpGet("departments/{departmentId:int}/realization")]
    public async Task<ActionResult<RealizationStatusDto>> GetDepartmentRealizationStatus(
        int departmentId,
        [FromQuery] int? year = null,
        CancellationToken cancellationToken = default)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == departmentId, cancellationToken);

        if (department == null)
        {
            return NotFound(new { message = "Department not found." });
        }

        // Prefer manually-entered realization data when available
        var targetYear = year ?? DateTime.UtcNow.Year;

        var manualEntries = await _context.RealizationEntries
            .AsNoTracking()
            .Where(r => r.DepartmentId == departmentId && r.Year == targetYear)
            .OrderBy(r => r.Month)
            .ToListAsync(cancellationToken);

        if (manualEntries.Count > 0)
        {
            // Build periods from manual entries; fill missing months with zeros
            var monthNames2 = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            var manualPeriods = new List<RealizationPeriodDto>();
            var entryByMonth = manualEntries.ToDictionary(e => e.Month);

            for (int m = 1; m <= 12; m++)
            {
                entryByMonth.TryGetValue(m, out var e);
                var realized = e?.RealizedValue ?? 0m;
                var planned  = e?.PlannedValue  ?? 0m;
                var target   = e?.TargetValue   ?? Math.Round(planned * 1.05m, 1);
                var forecast = e?.ForecastValue;
                var variance = target - realized;
                var rate     = target > 0 ? Math.Round(realized / target * 100m, 1) : 0m;

                manualPeriods.Add(new RealizationPeriodDto
                {
                    Month        = $"M{m}",
                    MonthNumber  = m,
                    Year         = targetYear,
                    PeriodLabel  = monthNames2[m - 1],
                    RealizedValue = realized,
                    PlannedValue  = planned,
                    ForecastValue = forecast,
                    TargetValue   = target,
                    VarianceToTarget = variance,
                    RealizationRate  = rate,
                });
            }

            var lastM   = manualPeriods.Last();
            var totReal = manualPeriods.Where(p => p.MonthNumber <= DateTime.UtcNow.Month).Select(p => p.RealizedValue).LastOrDefault();
            var totPlan = lastM.PlannedValue;
            var totTarg = lastM.TargetValue ?? 0m;

            return Ok(new RealizationStatusDto
            {
                Periods = manualPeriods,
                Summary = new RealizationSummaryDto
                {
                    TotalRealized = totReal,
                    TotalPlanned  = totPlan,
                    TotalForecast = lastM.ForecastValue,
                    TotalTarget   = totTarg,
                    OverallRealizationRate = totTarg > 0 ? Math.Round(totReal / totTarg * 100m, 1) : 0m,
                    Variance = totTarg - totReal,
                }
            });
        }

        // ── Fallback: compute from KPIs / tasks ───────────────────────────────
        var kpis = await _context.Set<Kpi>()
            .AsNoTracking()
            .Where(k => (k.DepartmentId == departmentId || (k.DepartmentId == null && k.ResponsibleDepartment == department.Name)))
            .ToListAsync(cancellationToken);

        var tasks = await _context.Tasks
            .AsNoTracking()
            .Where(t => t.DepartmentId == departmentId)
            .ToListAsync(cancellationToken);

        var projects = await _context.Projects
            .AsNoTracking()
            .Include(p => p.BusinessUnit)
            .Where(p => (p.DepartmentId == departmentId || p.Tasks.Any(t => t.DepartmentId == departmentId)))
            .ToListAsync(cancellationToken);

        // Build 12 monthly periods (M1 to M12)
        var periods = new List<RealizationPeriodDto>();
        decimal cumRealized = 0;
        decimal cumPlanned = 0;

        var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };

        for (int m = 1; m <= 12; m++)
        {
            var monthStr = m.ToString();
            var monthKpis = kpis.Where(k => k.Month == monthStr || (k.DoneDate.HasValue && k.DoneDate.Value.Month == m) || (k.EndDate.HasValue && k.EndDate.Value.Month == m)).ToList();
            var monthTasks = tasks.Where(t => (t.CompletedAt.HasValue && t.CompletedAt.Value.Month == m) || (t.DueDate.HasValue && t.DueDate.Value.Month == m)).ToList();

            var realizedInMonth = monthKpis.Count(k => k.Green || k.Done == true) + monthTasks.Count(t => t.Status == "Completed");
            var plannedInMonth = Math.Max(realizedInMonth, monthKpis.Count + monthTasks.Count);

            if (plannedInMonth == 0 && projects.Count > 0)
            {
                plannedInMonth = Math.Max(1, projects.Count);
                if (m <= DateTime.UtcNow.Month)
                {
                    realizedInMonth = (int)Math.Round(plannedInMonth * 0.85);
                }
            }

            cumRealized += (m <= DateTime.UtcNow.Month ? realizedInMonth : 0);
            cumPlanned += plannedInMonth;

            var targetValue = Math.Round(cumPlanned * 1.05m, 1);
            decimal? forecastValue = m >= DateTime.UtcNow.Month ? Math.Round(cumRealized + (cumPlanned - cumRealized) * 0.95m, 1) : null;
            var variance = targetValue - cumRealized;
            var rate = targetValue > 0 ? Math.Round(cumRealized / targetValue * 100m, 1) : 0m;

            periods.Add(new RealizationPeriodDto
            {
                Month = $"M{m}",
                MonthNumber = m,
                Year = targetYear,
                PeriodLabel = monthNames[m - 1],
                RealizedValue = m <= DateTime.UtcNow.Month ? cumRealized : 0,
                PlannedValue = cumPlanned,
                ForecastValue = forecastValue,
                TargetValue = targetValue,
                VarianceToTarget = variance,
                RealizationRate = rate
            });
        }

        var lastPeriod = periods.LastOrDefault();
        var totalRealized = periods.Where(p => p.MonthNumber <= DateTime.UtcNow.Month).Select(p => p.RealizedValue).LastOrDefault();
        var totalPlanned = lastPeriod?.PlannedValue ?? 0;
        var totalTarget = lastPeriod?.TargetValue ?? 0;

        var result = new RealizationStatusDto
        {
            Periods = periods,
            Summary = new RealizationSummaryDto
            {
                TotalRealized = totalRealized,
                TotalPlanned = totalPlanned,
                TotalForecast = lastPeriod?.ForecastValue,
                TotalTarget = totalTarget,
                OverallRealizationRate = totalTarget > 0 ? Math.Round(totalRealized / totalTarget * 100m, 1) : 0m,
                Variance = totalTarget - totalRealized
            }
        };

        return Ok(result);
    }

    [HttpGet("departments/{departmentId:int}/business-units")]
    public async Task<ActionResult<IEnumerable<BusinessUnitDashboardDto>>> GetBusinessUnitsDashboard(int departmentId)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == departmentId);

        if (department == null)
        {
            return NotFound(new { message = "Department not found." });
        }

        var departmentName = department.Name;

        var businessUnits = await _context.BusinessUnits
            .AsNoTracking()
            .Where(bu => bu.Name != null)
            .Select(bu => bu.Name!)
            .ToListAsync();

        if (!businessUnits.Any(x => string.Equals(x, "HMI", StringComparison.OrdinalIgnoreCase)))
        {
            businessUnits.Add("HMI");
        }

        if (!businessUnits.Any(x => string.Equals(x, "HIS", StringComparison.OrdinalIgnoreCase)))
        {
            businessUnits.Add("HIS");
        }

        if (!businessUnits.Any(x => string.Equals(x, "Performance", StringComparison.OrdinalIgnoreCase)))
        {
            businessUnits.Add("Performance");
        }

        var result = new List<BusinessUnitDashboardDto>();

        foreach (var buName in businessUnits)
        {
            var isPerformance = string.Equals(buName, "Performance", StringComparison.OrdinalIgnoreCase);

            var projects = await _context.Projects
                .AsNoTracking()
                .Include(p => p.BusinessUnit)
                .Where(p =>
                    (
                        isPerformance
                            ? p.BusinessUnit != null && (p.BusinessUnit.Name == "HMI" || p.BusinessUnit.Name == "HIS")
                            : p.BusinessUnit != null && p.BusinessUnit.Name == buName
                    )
                    && (p.DepartmentId == departmentId || p.Tasks.Any(t => t.DepartmentId == departmentId)))
                .ToListAsync();

            var kpis = await _context.Set<Kpi>()
                .AsNoTracking()
                .Where(k =>
                    (
                        isPerformance
                            ? k.BusinessUnit == "Performance" || k.BusinessUnit == "HMI" || k.BusinessUnit == "HIS" || k.SourceType == "Performance" || k.ProjectId == null
                            : k.BusinessUnit == buName
                    )
                    && (k.DepartmentId == departmentId || (k.DepartmentId == null && k.ResponsibleDepartment == departmentName)))
                .ToListAsync();

            var totalProjects = projects.Count;
            var onTrackProjects = projects.Count(p => p.Status == "On Track" || string.IsNullOrWhiteSpace(p.Status));
            var delayedProjects = projects.Count(p => p.Status != null && p.Status.Contains("Delay", StringComparison.OrdinalIgnoreCase));
            var riskProjects = projects.Count(p => p.Status != null && p.Status.Contains("Risk", StringComparison.OrdinalIgnoreCase));

            var avgProgress = totalProjects > 0
                ? Math.Round((decimal)projects.Sum(p => EstimateProjectProgress(p.Status)) / totalProjects, 1)
                : 0m;

            result.Add(
                new BusinessUnitDashboardDto(
                    buName,
                    new BuKpiSummaryDto(totalProjects, onTrackProjects, delayedProjects, riskProjects, avgProgress),
                    projects.Select(p => new BuProjectDto(p.Id, p.Title ?? "Untitled", p.Status ?? "On Track", p.BusinessUnit?.Name ?? "Unknown")).ToList(),
                    kpis.Select(k => new BuKpiDto(k.Id, k.Designation ?? "Untitled Kpi", k.Green, k.Yellow, k.Red)).ToList()
                )
            );
        }

        return Ok(result);
    }

    private static PublicPerformanceSummaryDto BuildProjectSummary(IReadOnlyCollection<PublicProjectDto> projects, IReadOnlyCollection<Kpi> kpis)
    {
        var totalProjects = projects.Count;
        var completedProjects = projects.Count(project => project.Status == "On Track" && project.Progress >= 95);
        var delayedProjects = projects.Count(project => project.Status == "Delayed");
        var activeProjects = Math.Max(0, totalProjects - completedProjects);

        var scheduleAdherence = kpis.Count > 0
            ? Math.Round((decimal)kpis.Count(kpi => kpi.Green || kpi.Yellow) / kpis.Count * 100m, 2)
            : (totalProjects == 0
                ? 0m
                : Math.Round((decimal)projects.Count(project => project.Status == "On Track") / totalProjects * 100m, 2));

        var overallKpiAchievement = kpis.Count > 0
            ? Math.Round((decimal)kpis.Count(kpi => kpi.Green || kpi.Yellow || kpi.Done == true) / kpis.Count * 100m, 2)
            : (totalProjects == 0 ? 0m : Math.Round((decimal)projects.Count(project => project.Status == "On Track") / totalProjects * 100m, 2));

        var overallMaturity = kpis.Count == 0
            ? 0m
            : Math.Round((decimal)kpis.Average(kpi =>
                kpi.Green ? 5.0 :
                kpi.Yellow ? 3.5 :
                kpi.Orange ? 2.0 :
                kpi.Red ? 1.0 : 2.5), 2);

        var deliveryPerformance = totalProjects == 0
            ? 0m
            : Math.Round((decimal)projects.Count(project => project.Status == "On Track") / totalProjects * 100m, 2);

        var projectHealth = totalProjects == 0
            ? 0m
            : Math.Round((decimal)projects.Sum(project => project.Health) / totalProjects, 2);

        return new PublicPerformanceSummaryDto(
            totalProjects,
            completedProjects,
            activeProjects,
            delayedProjects,
            EstimateAverageProgress(projects),
            scheduleAdherence,
            overallKpiAchievement,
            overallMaturity,
            projectHealth,
            deliveryPerformance);
    }

    private static PublicPerformanceSummaryDto BuildTaskSummary(IReadOnlyCollection<TaskItem> tasks, IReadOnlyCollection<Kpi> kpis)
    {
        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(task => task.Status == "Done" || task.Status == "Completed");
        var delayedTasks = tasks.Count(task => task.Status == "Delayed");
        var activeTasks = tasks.Count(task => task.Status == "Active" || task.Status == "Open" || task.Status == "In Progress");
        var avgProgress = totalTasks == 0 ? 0m : Math.Round(tasks.Average(task => (decimal)task.Progress), 2);
        var scheduleAdherence = totalTasks == 0
            ? 0m
            : Math.Round((decimal)tasks.Count(task => task.CompletedAt.HasValue && (!task.DueDate.HasValue || task.CompletedAt.Value <= task.DueDate.Value)) / totalTasks * 100m, 2);
        var overallKpiAchievement = totalTasks == 0
            ? 0m
            : Math.Round((decimal)completedTasks / totalTasks * 100m, 2);
        var overallMaturity = tasks.Count == 0
            ? 0m
            : Math.Round(Math.Min(5m, tasks.Average(task => (decimal)task.PerformanceScore) / 20m), 2);
        var taskHealth = tasks.Count == 0
            ? 0m
            : Math.Round(tasks.Average(task => (decimal)task.PerformanceScore), 2);
        var deliveryPerformance = kpis.Count > 0
            ? Math.Round(kpis.Where(kpi => kpi.AdherenceToSchedule.HasValue).Select(kpi => kpi.AdherenceToSchedule!.Value).DefaultIfEmpty(scheduleAdherence).Average(), 2)
            : scheduleAdherence;

        return new PublicPerformanceSummaryDto(
            totalTasks,
            completedTasks,
            activeTasks,
            delayedTasks,
            avgProgress,
            scheduleAdherence,
            overallKpiAchievement,
            overallMaturity,
            taskHealth,
            deliveryPerformance);
    }

    private static PublicPerformanceChartsDto BuildTaskCharts(IReadOnlyCollection<TaskItem> tasks)
    {
        var status = new List<PublicChartSliceDto>
        {
            new("Done",        tasks.Count(task => task.Status == "Done" || task.Status == "Completed")),
            new("In Progress", tasks.Count(task => task.Status == "In Progress" || task.Status == "Active")),
            new("On Hold",     tasks.Count(task => task.Status == "On Hold" || task.Status == "Open")),
            new("Delayed",     tasks.Count(task => task.Status == "Delayed")),
        };

        var assignees = tasks
            .GroupBy(task => string.IsNullOrWhiteSpace(task.AssigneeName) ? "Unassigned" : task.AssigneeName!)
            .Select(group => new PublicEmployeePerformanceDto(
                group.Key,
                group.Count(),
                group.Count(task => task.Status == "Done" || task.Status == "Completed"),
                Math.Round((decimal)group.Average(task => task.Progress), 2),
                Math.Round((decimal)group.Average(task => task.PerformanceScore), 2)))
            .OrderByDescending(item => item.PerformanceScore)
            .ThenByDescending(item => item.AssignedTasks)
            .Take(8)
            .ToList();

        var trend = tasks
            .Where(task => task.SendDate.HasValue || task.CompletedAt.HasValue)
            .GroupBy(task => (task.SendDate ?? task.CompletedAt)!.Value.ToString("dd MMM"))
            .Select(group => new PublicTrendPointDto(
                group.Key,
                group.Count(),
                group.Count(task => task.Status == "Done" || task.Status == "Completed")))
            .OrderBy(point => DateTime.TryParse(point.Label, out var parsed) ? parsed : DateTime.MaxValue)
            .Take(10)
            .ToList();

        return new PublicPerformanceChartsDto(status, assignees, trend);
    }

    private static PublicPerformanceChartsDto BuildProjectCharts(IReadOnlyCollection<PublicProjectDto> projects)
    {
        var status = new List<PublicChartSliceDto>
        {
            new("On Track", projects.Count(project => project.Status == "On Track")),
            new("Delayed", projects.Count(project => project.Status == "Delayed")),
            new("Risk", projects.Count(project => project.Status == "Risk")),
        };

        var byBu = projects
            .GroupBy(project => project.Bu)
            .Select(group => new PublicEmployeePerformanceDto(group.Key, group.Count(), 0, Math.Round(group.Average(project => (decimal)project.Progress), 2), Math.Round(group.Average(project => (decimal)project.Health), 2)))
            .ToList();

        var trend = projects
            .GroupBy(project => string.IsNullOrWhiteSpace(project.Deadline?.ToString("MMM")) ? "Open" : project.Deadline!.Value.ToString("MMM"))
            .Select(group => new PublicTrendPointDto(group.Key, group.Count(), group.Count(project => project.Status == "On Track")))
            .ToList();

        return new PublicPerformanceChartsDto(status, byBu, trend);
    }

    private static string MapProjectStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "Risk";
        }

        if (status.Contains("delay", StringComparison.OrdinalIgnoreCase)
            || status.Contains("block", StringComparison.OrdinalIgnoreCase)
            || status.Contains("hold", StringComparison.OrdinalIgnoreCase))
        {
            return "Delayed";
        }

        if (status.Contains("risk", StringComparison.OrdinalIgnoreCase)
            || status.Contains("warning", StringComparison.OrdinalIgnoreCase)
            || status.Contains("issue", StringComparison.OrdinalIgnoreCase))
        {
            return "Risk";
        }

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

    private static decimal EstimateAverageProgress(IReadOnlyCollection<PublicProjectDto> projects)
    {
        if (projects.Count == 0)
        {
            return 0m;
        }

        return Math.Round((decimal)projects.Sum(project => project.Progress) / projects.Count, 2);
    }

    public sealed record PublicDepartmentDto(int Id, string Name, string? BusinessUnitName);

    public sealed record PublicProjectDto(
        int Id,
        string Name,
        string Status,
        int Progress,
        string Bu,
        string Budget,
        DateTime? Deadline,
        int Health);

    public sealed record PublicEventDto(
        int Id,
        string Title,
        string? Description,
        DateTime? Date,
        string? Location,
        string? Type,
        int? EmployeeId,
        string? ImageUrl = null);

    public sealed record PublicEmployeeDto(
        int Id,
        string FirstName,
        string LastName,
        string? ProfessionalDomain,
        string? Seniority,
        string? Department,
        string? Role,
        DateTime? BirthDate,
        bool IsActive,
        string? Position,
        DateTime? HireDate,
        int? TeamId,
        string? Photo);

    public sealed record PublicPerformanceSummaryDto(
        int TotalProjects,
        int CompletedProjects,
        int ActiveProjects,
        int DelayedProjects,
        decimal AverageProjectProgress,
        decimal ScheduleAdherence,
        decimal OverallKpiAchievement,
        decimal OverallMaturity,
        decimal ProjectHealth,
        decimal DeliveryPerformance);

    public sealed record PublicChartSliceDto(string Name, int Value);

    public sealed record PublicEmployeePerformanceDto(
        string Label,
        int AssignedTasks,
        int CompletedTasks,
        decimal AverageProgress,
        decimal PerformanceScore);

    public sealed record PublicTrendPointDto(string Label, int CreatedTasks, int CompletedTasks);

    public sealed record PublicPerformanceChartsDto(
        IReadOnlyList<PublicChartSliceDto> TaskStatus,
        IReadOnlyList<PublicEmployeePerformanceDto> EmployeePerformance,
        IReadOnlyList<PublicTrendPointDto> CompletionTrend);

    public sealed record PublicDepartmentDashboardDto(
        PublicDepartmentDto Department,
        PublicPerformanceSummaryDto Performance,
        IReadOnlyList<PublicProjectDto> Projects,
        IReadOnlyList<PublicEventDto> Events,
        IReadOnlyList<PublicEmployeeDto> Employees,
        PublicPerformanceChartsDto Charts);

    public sealed record PublicInternationalBusinessDto(
        int Id,
        string Name,
        string? Country,
        string? PartnerName,
        string? Description,
        IReadOnlyList<string> Photos,
        bool IsNewBusiness,
        string? ProjectInfo,
        string? VolumeLifetime,
        string? SalesLifetime,
        string? Sop,
        string? ProductionLocation,
        DateTime? UpdatedAtUtc);
}
