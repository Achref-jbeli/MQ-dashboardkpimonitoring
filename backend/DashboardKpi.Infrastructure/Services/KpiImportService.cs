using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Services;

public class KpiImportService : IKpiImportService
{
    private readonly ApplicationDbContext _context;
    private readonly IExcelKpiImporter _excelImporter;
    private readonly IJiraKpiImporter _jiraImporter;
    private readonly IKpiCalculationEngine _calculationEngine;
    private readonly IKpiPersistenceService _persistenceService;

    public KpiImportService(
        ApplicationDbContext context,
        IExcelKpiImporter excelImporter,
        IJiraKpiImporter jiraImporter,
        IKpiCalculationEngine calculationEngine,
        IKpiPersistenceService persistenceService)
    {
        _context = context;
        _excelImporter = excelImporter;
        _jiraImporter = jiraImporter;
        _calculationEngine = calculationEngine;
        _persistenceService = persistenceService;
    }

    public async Task<KpiImportResultDto> ImportFromFileAsync(
        int departmentId,
        ImportProjectKpiCsvDto dto,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        Project? project = null;
        if (dto.ProjectId.HasValue)
        {
            project = await _context.Projects
                .Include(p => p.Department)
                .Include(p => p.BusinessUnit)
                .FirstOrDefaultAsync(p => p.Id == dto.ProjectId.Value && p.DepartmentId == departmentId, cancellationToken);

            if (project == null)
            {
                throw new InvalidOperationException($"Project {dto.ProjectId.Value} does not belong to department {departmentId}.");
            }
        }

        var department = await _context.Departments
            .Include(d => d.BusinessUnit)
            .FirstOrDefaultAsync(d => d.Id == departmentId, cancellationToken);

        var businessUnit = project?.BusinessUnit?.Name
            ?? (!string.IsNullOrWhiteSpace(dto.BusinessUnit) ? dto.BusinessUnit.Trim() : department?.BusinessUnit?.Name ?? "General");

        var performanceUnit = !string.IsNullOrWhiteSpace(dto.PerformanceUnit)
            ? dto.PerformanceUnit.Trim()
            : (department?.Name ?? "Performance");

        var (records, errors) = await _excelImporter.ImportAsync(fileStream, fileName, departmentId, dto.ProjectId, businessUnit, cancellationToken);

        if (records.Count == 0 && errors.Count > 0)
        {
            // Early return validation failure without persistence
            return new KpiImportResultDto
            {
                Success = false,
                Status = "Failed",
                DepartmentId = departmentId,
                ProjectId = dto.ProjectId,
                PerformanceUnit = performanceUnit,
                BusinessUnit = businessUnit,
                TotalRows = errors.Count,
                FailedCount = errors.Count,
                Errors = errors.ToList()
            };
        }

        var kpiResults = await _calculationEngine.CalculateKpisAsync(records, departmentId, dto.ProjectId, cancellationToken);

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var sourceType = ext is ".xlsx" or ".xlsm" or ".xltx" ? "Excel" : "Csv";

        return await _persistenceService.PersistImportAsync(
            departmentId,
            dto.ProjectId,
            performanceUnit,
            businessUnit,
            sourceType,
            fileName,
            records,
            kpiResults,
            errors,
            cancellationToken);
    }

    public async Task<KpiImportResultDto> ImportFromJiraAsync(
        int departmentId,
        ImportProjectKpiJiraDto dto,
        CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects
            .Include(p => p.BusinessUnit)
            .FirstOrDefaultAsync(p => p.Id == dto.ProjectId && p.DepartmentId == departmentId, cancellationToken);

        if (project == null)
        {
            throw new InvalidOperationException($"Project {dto.ProjectId} does not belong to department {departmentId}.");
        }

        var extractionApi = await _context.DataExtractionApis
            .FirstOrDefaultAsync(api => api.Id == dto.ExtractionApiId && api.DepartmentId == departmentId && api.ProjectId == dto.ProjectId && api.IsActive, cancellationToken);

        if (extractionApi == null)
        {
            throw new InvalidOperationException("Active Extraction API configuration not found for this project and department.");
        }

        var (records, errors) = await _jiraImporter.ImportAsync(
            extractionApi,
            dto.JiraJql,
            project.ApiKey,
            departmentId,
            dto.ProjectId,
            cancellationToken);

        if (records.Count == 0 && errors.Count > 0)
        {
            return new KpiImportResultDto
            {
                Success = false,
                Status = "Failed",
                DepartmentId = departmentId,
                ProjectId = dto.ProjectId,
                PerformanceUnit = "Project",
                BusinessUnit = project.BusinessUnit?.Name ?? "General",
                TotalRows = errors.Count,
                FailedCount = errors.Count,
                Errors = errors.ToList()
            };
        }

        var kpiResults = await _calculationEngine.CalculateKpisAsync(records, departmentId, dto.ProjectId, cancellationToken);
        var businessUnit = project.BusinessUnit?.Name ?? "General";

        var result = await _persistenceService.PersistImportAsync(
            departmentId,
            dto.ProjectId,
            "Project",
            businessUnit,
            "Jira",
            extractionApi.Name ?? $"Jira-{extractionApi.Id}",
            records,
            kpiResults,
            errors,
            cancellationToken);

        extractionApi.LastSyncedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return result;
    }

    public async Task<IReadOnlyList<MonthlyAdherenceDto>> GetMonthlyAdherenceAsync(
        int departmentId,
        int? projectId = null,
        string? businessUnit = null,
        int? year = null,
        IReadOnlyList<string>? responsibleDepartments = null,
        CancellationToken cancellationToken = default)
    {
        var tasksQuery = _context.Tasks.AsNoTracking().Where(t => t.DepartmentId == departmentId);

        if (responsibleDepartments != null && responsibleDepartments.Count > 0)
        {
            tasksQuery = tasksQuery.Where(t => responsibleDepartments.Contains(t.ResponsibleDepartment));
        }

        if (projectId.HasValue)
        {
            tasksQuery = tasksQuery.Where(t => t.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(businessUnit))
        {
            tasksQuery = tasksQuery.Where(t => t.BusinessUnit == businessUnit);
        }

        var tasks = await tasksQuery.ToListAsync(cancellationToken);

        if (tasks.Count > 0)
        {
            var now = DateTime.UtcNow;
            var startOfCurrentMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var normalized = new List<NormalizedKpiRecord>();

            foreach (var t in tasks)
            {
                // Only completed tasks are classified. Open tasks are excluded entirely.
                if (!t.CompletedAt.HasValue || t.CompletedAt.Value >= startOfCurrentMonth)
                    continue;

                // Group by Send date month. Tasks with no Send date are excluded.
                if (!t.SendDate.HasValue || t.SendDate.Value >= startOfCurrentMonth)
                    continue;

                // due_date = InitialDate (re-planned) if set, else the original End date.
                var dueDate = t.InitialDate ?? t.DueDate;
                if (!dueDate.HasValue)
                    continue;

                // Optional year filter on Send date.
                if (year.HasValue && t.SendDate.Value.Year != year.Value)
                    continue;

                // adh_days = NETWORKDAYS(due_date, Done) — Excel semantics, Mon-Fri inclusive.
                // < 0   → finished before deadline → green
                // 0–15  → on time or up to 15 working days late → yellow
                // 16–55 → 16–55 working days late → orange
                // > 55  → more than 55 working days late → red
                var adhDays = NetworkDays(dueDate.Value, t.CompletedAt.Value);

                normalized.Add(new NormalizedKpiRecord
                {
                    DepartmentId = t.DepartmentId,
                    ProjectId = t.ProjectId,
                    Title = t.Title,
                    Status = t.Status,
                    CreatedDate = t.SendDate,
                    SendDate = t.SendDate,
                    DueDate = t.DueDate,
                    CompletedDate = t.CompletedAt,
                    InitialDate = t.InitialDate,
                    Month = t.SendDate.Value.Month.ToString(),
                    IsGreen  = adhDays < 0,
                    IsYellow = adhDays >= 0 && adhDays < 16,
                    IsOrange = adhDays >= 16 && adhDays <= 55,
                    IsRed    = adhDays > 55,
                });
            }

            return _calculationEngine.ComputeMonthlyAdherence(normalized, year);
        }

        // Fallback to Kpis table if tasks were not populated
        var kpisQuery = _context.Kpis.AsNoTracking().Where(k => k.DepartmentId == departmentId && k.Month != null && k.Month != "");
        if (projectId.HasValue) kpisQuery = kpisQuery.Where(k => k.ProjectId == projectId.Value);
        if (!string.IsNullOrWhiteSpace(businessUnit)) kpisQuery = kpisQuery.Where(k => k.BusinessUnit == businessUnit);

        var kpis = await kpisQuery.ToListAsync(cancellationToken);
        var normalizedFromKpi = kpis.Select(k => new NormalizedKpiRecord
        {
            DepartmentId = k.DepartmentId,
            ProjectId = k.ProjectId,
            Month = k.Month,
            IsGreen = k.Green,
            IsYellow = k.Yellow,
            IsOrange = k.Orange,
            IsRed = k.Red,
        }).ToList();

        return _calculationEngine.ComputeMonthlyAdherence(normalizedFromKpi, year);
    }

    // Excel NETWORKDAYS(due_date, done_date):
    //   done >= due  → positive working-day count in [due, done]  (same day = 1)
    //   done <  due  → negative working-day count in [done, due]  (1 day early = -2)
    private static int NetworkDays(DateTime dueDate, DateTime doneDate)
    {
        var due  = dueDate.Date;
        var done = doneDate.Date;
        return done >= due
            ? CountWorkingDaysInclusive(due, done)
            : -CountWorkingDaysInclusive(done, due);
    }

    private static int CountWorkingDaysInclusive(DateTime from, DateTime to)
    {
        int totalDays  = (int)(to - from).TotalDays + 1;
        int fullWeeks  = totalDays / 7;
        int remaining  = totalDays % 7;
        int workDays   = fullWeeks * 5;
        int startDow   = (int)from.DayOfWeek; // 0 = Sun, 6 = Sat
        for (int i = 0; i < remaining; i++)
        {
            int dow = (startDow + i) % 7;
            if (dow != 0 && dow != 6) workDays++;
        }
        return workDays;
    }
}
