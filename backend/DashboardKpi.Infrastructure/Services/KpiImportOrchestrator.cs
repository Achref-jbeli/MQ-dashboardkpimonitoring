using System.Text.RegularExpressions;
using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using DashboardKpi.Infrastructure.Extraction;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Services;

public class KpiImportOrchestrator : IKpiImportOrchestrator
{
    private readonly ApplicationDbContext _context;
    private readonly IKpiDataExtractor _excelExtractor;
    private readonly IKpiDataExtractor _csvExtractor;
    private readonly IJiraKpiExtractor _jiraExtractor;
    private readonly IKpiNormalizationService _normalizationService;
    private readonly IKpiProcessor _kpiProcessor;
    private readonly IPerformanceKpiProcessor _performanceKpiProcessor;
    private readonly IKpiPersistenceService _persistenceService;

    public KpiImportOrchestrator(
        ApplicationDbContext context,
        ExcelKpiExtractor excelExtractor,
        CsvKpiExtractor csvExtractor,
        IJiraKpiExtractor jiraExtractor,
        IKpiNormalizationService normalizationService,
        IKpiProcessor kpiProcessor,
        IPerformanceKpiProcessor performanceKpiProcessor,
        IKpiPersistenceService persistenceService)
    {
        _context = context;
        _excelExtractor = excelExtractor;
        _csvExtractor = csvExtractor;
        _jiraExtractor = jiraExtractor;
        _normalizationService = normalizationService;
        _kpiProcessor = kpiProcessor;
        _performanceKpiProcessor = performanceKpiProcessor;
        _persistenceService = persistenceService;
    }

    public async Task<DataExtractionApi> CreateExtractionApiAsync(int departmentId, AddDataExtractionApiDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureProjectInDepartmentAsync(departmentId, dto.ProjectId, cancellationToken);

        var entity = new DataExtractionApi
        {
            Name = dto.Name,
            BaseUrl = dto.BaseUrl,
            ApiKey = dto.ApiKey,
            ProjectId = dto.ProjectId,
            DepartmentId = departmentId,
            SourceType = dto.SourceType,
            EndpointPath = dto.EndpointPath,
            CsvDelimiter = string.IsNullOrWhiteSpace(dto.CsvDelimiter) ? "," : dto.CsvDelimiter,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
        };

        _context.DataExtractionApis.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<DataProcessingApi> CreateProcessingApiAsync(int departmentId, AddDataProcessingApiDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureProjectInDepartmentAsync(departmentId, dto.ProjectId, cancellationToken);

        var entity = new DataProcessingApi
        {
            Name = dto.Name,
            BaseUrl = dto.BaseUrl,
            ApiKey = dto.ApiKey,
            ProjectId = dto.ProjectId,
            DepartmentId = departmentId,
            RulesJson = dto.RulesJson,
            Notes = dto.Notes,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
        };

        _context.DataProcessingApis.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<DataCalculationApi> CreateCalculationApiAsync(int departmentId, AddDataCalculationApiDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureProjectInDepartmentAsync(departmentId, dto.ProjectId, cancellationToken);

        var entity = new DataCalculationApi
        {
            Name = dto.Name,
            BaseUrl = dto.BaseUrl,
            ApiKey = dto.ApiKey,
            ProjectId = dto.ProjectId,
            DepartmentId = departmentId,
            KpiLabel = dto.KpiLabel,
            FormulaExpression = dto.FormulaExpression,
            Unit = dto.Unit,
            DecimalPlaces = dto.DecimalPlaces,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
        };

        _context.DataCalculationApis.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<IReadOnlyCollection<ExternalApiSummaryDto>> GetProjectApisAsync(int departmentId, int projectId, CancellationToken cancellationToken = default)
    {
        await EnsureProjectInDepartmentAsync(departmentId, projectId, cancellationToken);

        return await _context.ExternalApis
            .Where(api => api.DepartmentId == departmentId && api.ProjectId == projectId)
            .Select(api => new ExternalApiSummaryDto
            {
                Id = api.Id,
                Name = api.Name ?? string.Empty,
                Kind = EF.Property<string>(api, "ApiKind"),
                ProjectId = api.ProjectId,
                DepartmentId = api.DepartmentId,
                IsActive = api.IsActive,
                LastSyncedAtUtc = api.LastSyncedAtUtc,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<KpiImportResultDto> ImportProjectKpisFromCsvAsync(int departmentId, ImportProjectKpiCsvDto dto, Stream csvStream, CancellationToken cancellationToken = default)
        => await ImportProjectKpisFromFileAsync(departmentId, dto, csvStream, "import.csv", cancellationToken);

    public async Task<KpiImportResultDto> ImportProjectKpisFromFileAsync(
        int departmentId,
        ImportProjectKpiCsvDto dto,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        var extractionApi = dto.ExtractionApiId.HasValue && dto.ProjectId.HasValue
            ? await _context.DataExtractionApis.FirstOrDefaultAsync(api => api.Id == dto.ExtractionApiId.Value && api.DepartmentId == departmentId && api.ProjectId == dto.ProjectId.Value && api.IsActive, cancellationToken)
            : null;

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        IReadOnlyList<RawKpiRecord> rawRecords;

        if (ext is ".xlsx" or ".xlsm" or ".xltx")
        {
            rawRecords = await _excelExtractor.ExtractAsync(fileStream, fileName, cancellationToken);
        }
        else
        {
            rawRecords = await _csvExtractor.ExtractAsync(fileStream, fileName, cancellationToken);
        }

        if (PerformanceDataExtractor.LooksLikeEmployeeTaskImport(rawRecords))
        {
            return await ProcessPerformanceImportAsync(departmentId, dto, rawRecords, extractionApi, fileName, cancellationToken);
        }

        if (dto.ProjectId.HasValue)
        {
            var project = await EnsureProjectInDepartmentAsync(departmentId, dto.ProjectId.Value, cancellationToken);
            var processingRulesJson = await LoadProcessingRulesJsonAsync(departmentId, dto.ProjectId.Value, cancellationToken);

            var normalizedRecords = _normalizationService.NormalizeRecords(rawRecords, processingRulesJson);
            var metrics = await _kpiProcessor.ProcessKpisAsync(normalizedRecords, departmentId, dto.ProjectId.Value, cancellationToken);

            var businessUnit = project.BusinessUnit?.Name ?? (!string.IsNullOrWhiteSpace(dto.BusinessUnit) ? dto.BusinessUnit : "General");
            var result = await _persistenceService.PersistProjectKpisAsync(
                departmentId,
                project.Id,
                businessUnit,
                ext is ".xlsx" or ".xlsm" ? "Excel" : "Csv",
                fileName,
                metrics,
                normalizedRecords,
                cancellationToken);

            if (extractionApi != null)
            {
                extractionApi.LastSyncedAtUtc = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }

            return result;
        }
        else
        {
            var department = await _context.Departments
                .Include(d => d.BusinessUnit)
                .FirstOrDefaultAsync(d => d.Id == departmentId, cancellationToken);

            var normalizedRecords = _normalizationService.NormalizeRecords(rawRecords, null);
            var metrics = await _kpiProcessor.ProcessKpisAsync(normalizedRecords, departmentId, null, cancellationToken);

            var departmentName = department?.Name ?? string.Empty;
            var performanceUnit = !string.IsNullOrWhiteSpace(dto.PerformanceUnit)
                ? dto.PerformanceUnit.Trim()
                : (!string.IsNullOrWhiteSpace(departmentName) ? departmentName : "Performance");

            var businessUnit = !string.IsNullOrWhiteSpace(dto.BusinessUnit)
                ? dto.BusinessUnit.Trim()
                : (department?.BusinessUnit?.Name ?? "Performance");

            var result = await _persistenceService.PersistPerformanceKpisAsync(
                departmentId,
                performanceUnit,
                businessUnit,
                ext is ".xlsx" or ".xlsm" ? "Excel" : "Csv",
                fileName,
                metrics,
                normalizedRecords,
                cancellationToken);

            if (extractionApi != null)
            {
                extractionApi.LastSyncedAtUtc = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
            }

            return result;
        }
    }

    public async Task<KpiImportResultDto> ImportProjectKpisFromJiraAsync(
        int departmentId,
        ImportProjectKpiJiraDto dto,
        CancellationToken cancellationToken = default)
    {
        var project = await EnsureProjectInDepartmentAsync(departmentId, dto.ProjectId, cancellationToken);

        var extractionApi = await _context.DataExtractionApis
            .FirstOrDefaultAsync(api => api.Id == dto.ExtractionApiId && api.DepartmentId == departmentId && api.ProjectId == dto.ProjectId && api.IsActive, cancellationToken);

        if (extractionApi == null)
        {
            throw new InvalidOperationException("Extraction API configuration not found for this project and department.");
        }

        var rawRecords = await _jiraExtractor.ExtractAsync(extractionApi, dto.JiraJql, project.ApiKey, cancellationToken);
        var processingRulesJson = await LoadProcessingRulesJsonAsync(departmentId, dto.ProjectId, cancellationToken);

        var normalizedRecords = _normalizationService.NormalizeRecords(rawRecords, processingRulesJson);
        var metrics = await _kpiProcessor.ProcessKpisAsync(normalizedRecords, departmentId, dto.ProjectId, cancellationToken);

        var businessUnit = project.BusinessUnit?.Name ?? "General";
        var result = await _persistenceService.PersistProjectKpisAsync(
            departmentId,
            project.Id,
            businessUnit,
            "Jira",
            extractionApi.Name ?? $"Jira-{extractionApi.Id}",
            metrics,
            normalizedRecords,
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
        // Try Tasks table first — this is where Excel imports land
        var tasksQuery = _context.Tasks.AsNoTracking().Where(t => t.DepartmentId == departmentId);
        if (responsibleDepartments != null && responsibleDepartments.Count > 0)
            tasksQuery = tasksQuery.Where(t => responsibleDepartments.Contains(t.ResponsibleDepartment));
        if (projectId.HasValue) tasksQuery = tasksQuery.Where(t => t.ProjectId == projectId.Value);
        if (!string.IsNullOrWhiteSpace(businessUnit)) tasksQuery = tasksQuery.Where(t => t.BusinessUnit == businessUnit);

        var tasks = await tasksQuery.ToListAsync(cancellationToken);

        if (tasks.Count > 0)
        {
            var now = DateTime.UtcNow;
            var startOfCurrentMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthCounts = new Dictionary<string, (int g, int y, int o, int r)>(StringComparer.OrdinalIgnoreCase);

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

                if (year.HasValue && t.SendDate.Value.Year != year.Value)
                    continue;

                var adhDays = NetworkDays(dueDate.Value, t.CompletedAt.Value);
                bool isGreen  = adhDays < 0;
                bool isYellow = adhDays >= 0 && adhDays < 16;
                bool isOrange = adhDays >= 16 && adhDays <= 55;
                bool isRed    = adhDays > 55;

                var monthKey = t.SendDate.Value.Month.ToString();
                if (!monthCounts.TryGetValue(monthKey, out var mc)) mc = (0, 0, 0, 0);
                monthCounts[monthKey] = (mc.g + (isGreen ? 1 : 0), mc.y + (isYellow ? 1 : 0), mc.o + (isOrange ? 1 : 0), mc.r + (isRed ? 1 : 0));
            }

            var taskResults = new List<MonthlyAdherenceDto>();
            for (int m = 1; m <= 12; m++)
            {
                var mk = m.ToString();
                monthCounts.TryGetValue(mk, out var v);
                var total = v.g + v.y + v.o + v.r;
                var gp = total > 0 ? Math.Round((decimal)v.g / total * 100m, 2) : 0m;
                var yp = total > 0 ? Math.Round((decimal)v.y / total * 100m, 2) : 0m;
                var op = total > 0 ? Math.Round((decimal)v.o / total * 100m, 2) : 0m;
                var rp = total > 0 ? Math.Round((decimal)v.r / total * 100m, 2) : 0m;
                taskResults.Add(new MonthlyAdherenceDto { Month = mk, GreenCount = v.g, YellowCount = v.y, OrangeCount = v.o, RedCount = v.r, TotalCount = total, GreenPercentage = gp, YellowPercentage = yp, OrangePercentage = op, RedPercentage = rp, AdherencePercentage = gp + yp, AdherenceCount = v.g + v.y });
            }

            var gg = taskResults.Sum(r => r.GreenCount); var gy = taskResults.Sum(r => r.YellowCount);
            var go = taskResults.Sum(r => r.OrangeCount); var gr = taskResults.Sum(r => r.RedCount);
            var gt = gg + gy + go + gr;
            var ggp = gt > 0 ? Math.Round((decimal)gg / gt * 100m, 2) : 0m;
            var gyp = gt > 0 ? Math.Round((decimal)gy / gt * 100m, 2) : 0m;
            var gop = gt > 0 ? Math.Round((decimal)go / gt * 100m, 2) : 0m;
            var grp = gt > 0 ? Math.Round((decimal)gr / gt * 100m, 2) : 0m;
            taskResults.Add(new MonthlyAdherenceDto { Month = "TOTAL GÉNÉRAL", GreenCount = gg, YellowCount = gy, OrangeCount = go, RedCount = gr, TotalCount = gt, GreenPercentage = ggp, YellowPercentage = gyp, OrangePercentage = gop, RedPercentage = grp, AdherencePercentage = ggp + gyp, AdherenceCount = gg + gy });
            return taskResults;
        }

        // Fall back to Kpi table if no tasks found
        var query = _context.Set<Kpi>()
            .AsNoTracking()
            .Where(k => k.DepartmentId == departmentId && k.Month != null && k.Month != "");

        if (projectId.HasValue)
        {
            query = query.Where(k => k.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(businessUnit))
        {
            query = query.Where(k => k.BusinessUnit == businessUnit);
        }

        if (year.HasValue)
        {
            var yearPrefix = year.Value.ToString();
            query = query.Where(k => k.Month!.StartsWith(yearPrefix));
        }

        var rawGrouped = await query
            .GroupBy(k => k.Month)
            .Select(g => new
            {
                Month = g.Key!,
                Green = g.Count(k => k.Green),
                Yellow = g.Count(k => k.Yellow),
                Orange = g.Count(k => k.Orange),
                Red = g.Count(k => k.Red),
                Total = g.Count()
            })
            .ToListAsync(cancellationToken);

        var monthDict = new Dictionary<string, (int green, int yellow, int orange, int red, int total)>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in rawGrouped)
        {
            var key = NormalizeMonthKey(item.Month);
            if (monthDict.TryGetValue(key, out var existing))
            {
                monthDict[key] = (
                    existing.green + item.Green,
                    existing.yellow + item.Yellow,
                    existing.orange + item.Orange,
                    existing.red + item.Red,
                    existing.total + item.Total
                );
            }
            else
            {
                monthDict[key] = (item.Green, item.Yellow, item.Orange, item.Red, item.Total);
            }
        }

        var results = new List<MonthlyAdherenceDto>();

        // Ensure all months 1 through 12 are present in chronological order
        for (int m = 1; m <= 12; m++)
        {
            var monthKey = m.ToString();
            monthDict.TryGetValue(monthKey, out var val);

            var totalCount = val.green + val.yellow + val.orange + val.red;
            totalCount = Math.Max(totalCount, val.total);

            var greenPct = totalCount > 0 ? Math.Round((decimal)val.green / totalCount * 100m, 2) : 0m;
            var yellowPct = totalCount > 0 ? Math.Round((decimal)val.yellow / totalCount * 100m, 2) : 0m;
            var orangePct = totalCount > 0 ? Math.Round((decimal)val.orange / totalCount * 100m, 2) : 0m;
            var redPct = totalCount > 0 ? Math.Round((decimal)val.red / totalCount * 100m, 2) : 0m;

            results.Add(new MonthlyAdherenceDto
            {
                Month = monthKey,
                GreenCount = val.green,
                YellowCount = val.yellow,
                OrangeCount = val.orange,
                RedCount = val.red,
                TotalCount = totalCount,
                GreenPercentage = greenPct,
                YellowPercentage = yellowPct,
                OrangePercentage = orangePct,
                RedPercentage = redPct,
                AdherencePercentage = greenPct + yellowPct,
                AdherenceCount = val.green + val.yellow
            });
        }

        // Add any non-1..12 custom month keys if they exist in DB
        foreach (var (k, v) in monthDict)
        {
            if (int.TryParse(k, out var parsedInt) && parsedInt >= 1 && parsedInt <= 12)
            {
                continue;
            }

            var totalCount = v.green + v.yellow + v.orange + v.red;
            totalCount = Math.Max(totalCount, v.total);

            var greenPct = totalCount > 0 ? Math.Round((decimal)v.green / totalCount * 100m, 2) : 0m;
            var yellowPct = totalCount > 0 ? Math.Round((decimal)v.yellow / totalCount * 100m, 2) : 0m;
            var orangePct = totalCount > 0 ? Math.Round((decimal)v.orange / totalCount * 100m, 2) : 0m;
            var redPct = totalCount > 0 ? Math.Round((decimal)v.red / totalCount * 100m, 2) : 0m;

            results.Add(new MonthlyAdherenceDto
            {
                Month = k,
                GreenCount = v.green,
                YellowCount = v.yellow,
                OrangeCount = v.orange,
                RedCount = v.red,
                TotalCount = totalCount,
                GreenPercentage = greenPct,
                YellowPercentage = yellowPct,
                OrangePercentage = orangePct,
                RedPercentage = redPct,
                AdherencePercentage = greenPct + yellowPct,
                AdherenceCount = v.green + v.yellow
            });
        }

        // TOTAL GÉNÉRAL calculation from the complete department dataset
        var grandGreen = results.Sum(r => r.GreenCount);
        var grandYellow = results.Sum(r => r.YellowCount);
        var grandOrange = results.Sum(r => r.OrangeCount);
        var grandRed = results.Sum(r => r.RedCount);
        var grandTotal = grandGreen + grandYellow + grandOrange + grandRed;

        var grandGreenPct = grandTotal > 0 ? Math.Round((decimal)grandGreen / grandTotal * 100m, 2) : 0m;
        var grandYellowPct = grandTotal > 0 ? Math.Round((decimal)grandYellow / grandTotal * 100m, 2) : 0m;
        var grandOrangePct = grandTotal > 0 ? Math.Round((decimal)grandOrange / grandTotal * 100m, 2) : 0m;
        var grandRedPct = grandTotal > 0 ? Math.Round((decimal)grandRed / grandTotal * 100m, 2) : 0m;

        results.Add(new MonthlyAdherenceDto
        {
            Month = "TOTAL GÉNÉRAL",
            GreenCount = grandGreen,
            YellowCount = grandYellow,
            OrangeCount = grandOrange,
            RedCount = grandRed,
            TotalCount = grandTotal,
            GreenPercentage = grandGreenPct,
            YellowPercentage = grandYellowPct,
            OrangePercentage = grandOrangePct,
            RedPercentage = grandRedPct,
            AdherencePercentage = grandGreenPct + grandYellowPct,
            AdherenceCount = grandGreen + grandYellow
        });

        return results;
    }

    private static string NormalizeMonthKey(string? rawMonth)
    {
        if (string.IsNullOrWhiteSpace(rawMonth)) return "1";
        rawMonth = rawMonth.Trim();

        if (int.TryParse(rawMonth, out var m) && m >= 1 && m <= 12)
        {
            return m.ToString();
        }

        if (DateTime.TryParse(rawMonth, out var dt))
        {
            return dt.Month.ToString();
        }

        var match = Regex.Match(rawMonth, @"\b(1[0-2]|[1-9])\b");
        if (match.Success)
        {
            return match.Value;
        }

        return rawMonth;
    }

    private async Task<KpiImportResultDto> ProcessPerformanceImportAsync(
        int departmentId,
        ImportProjectKpiCsvDto dto,
        IReadOnlyList<RawKpiRecord> rawRecords,
        DataExtractionApi? extractionApi,
        string fileName,
        CancellationToken cancellationToken)
    {
        Project? project = null;
        if (dto.ProjectId.HasValue)
        {
            project = await EnsureProjectInDepartmentAsync(departmentId, dto.ProjectId.Value, cancellationToken);
        }

        var departmentName = project?.Department?.Name
            ?? await _context.Departments.Where(d => d.Id == departmentId).Select(d => d.Name).FirstOrDefaultAsync(cancellationToken)
            ?? string.Empty;

        var performanceUnit = !string.IsNullOrWhiteSpace(dto.PerformanceUnit)
            ? dto.PerformanceUnit.Trim()
            : (!string.IsNullOrWhiteSpace(departmentName) ? departmentName : "Performance");

        var businessUnit = project?.BusinessUnit?.Name ?? "Performance";

        var parsedTasks = PerformanceDataExtractor.ParseTaskItems(rawRecords, departmentId, dto.ProjectId, businessUnit, performanceUnit);

        await PersistTasksAsync(departmentId, dto.ProjectId, performanceUnit, parsedTasks, cancellationToken);

        var taskMetrics = _performanceKpiProcessor.CalculateTaskMetrics(parsedTasks);
        var result = await _persistenceService.PersistPerformanceKpisAsync(
            departmentId,
            performanceUnit,
            businessUnit,
            "Performance",
            fileName,
            taskMetrics,
            records: null,
            cancellationToken: cancellationToken);

        if (extractionApi != null)
        {
            extractionApi.LastSyncedAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private async Task PersistTasksAsync(
        int departmentId,
        int? projectId,
        string responsibleDepartment,
        IReadOnlyCollection<TaskItem> parsedTasks,
        CancellationToken cancellationToken)
    {
        if (parsedTasks.Count == 0)
        {
            return;
        }

        var employees = await _context.Employees
            .Where(e => e.DepartmentId == departmentId)
            .ToListAsync(cancellationToken);

        var existingTasks = await _context.Set<TaskItem>()
            .Where(t => t.DepartmentId == departmentId && t.ProjectId == projectId && t.ResponsibleDepartment == responsibleDepartment)
            .ToListAsync(cancellationToken);

        foreach (var incoming in parsedTasks)
        {
            var assignee = ResolveEmployee(employees, incoming.AssigneeName);
            var responsible = ResolveEmployee(employees, incoming.ResponsibleName);
            var teamId = assignee?.TeamId;

            var task = existingTasks.FirstOrDefault(item =>
                item.ProjectId == projectId
                && string.Equals(item.ChangeNumber, incoming.ChangeNumber, StringComparison.OrdinalIgnoreCase)
                && string.Equals(item.Title, incoming.Title, StringComparison.OrdinalIgnoreCase)
                && string.Equals(item.AssigneeName, incoming.AssigneeName, StringComparison.OrdinalIgnoreCase)
                && item.SendDate == incoming.SendDate);

            if (task == null)
            {
                task = new TaskItem
                {
                    DepartmentId = departmentId,
                    ProjectId = projectId,
                };
                _context.Set<TaskItem>().Add(task);
                existingTasks.Add(task);
            }

            task.Title = incoming.Title;
            task.Description = incoming.Description;
            task.ChangeNumber = incoming.ChangeNumber;
            task.ReasonForChange = incoming.ReasonForChange;
            task.BusinessUnit = incoming.BusinessUnit;
            task.MecType = incoming.MecType;
            task.Plant = incoming.Plant;
            task.WbsElement = incoming.WbsElement;
            task.WorkItem = incoming.WorkItem;
            task.Function = incoming.Function;
            task.Note = incoming.Note;
            task.SourceMonth = incoming.SourceMonth;
            task.Status = incoming.Status;
            task.Progress = incoming.Progress;
            task.PerformanceScore = incoming.PerformanceScore;
            task.ResponsibleName = incoming.ResponsibleName;
            task.ResponsibleDepartment = incoming.ResponsibleDepartment;
            task.CreatedBy = incoming.CreatedBy;
            task.AssigneeName = incoming.AssigneeName;
            task.CreatedOn = incoming.CreatedOn;
            task.SendDate = incoming.SendDate;
            task.DueDate = incoming.DueDate;
            task.CompletedAt = incoming.CompletedAt;
            task.InitialDate = incoming.InitialDate;
            task.ForwardedDate = incoming.ForwardedDate;
            task.Days = incoming.Days;
            task.AssigneeId = assignee?.Id;
            task.TeamLeaderId = responsible?.Id;
            task.TeamId = teamId;
        }

        await _context.SaveChangesAsync(cancellationToken);
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

    private static Employee? ResolveEmployee(IEnumerable<Employee> employees, string? rawName)
    {
        if (string.IsNullOrWhiteSpace(rawName)) return null;
        var normalized = NormalizePersonKey(rawName);
        return employees.FirstOrDefault(e =>
            NormalizePersonKey($"{e.FirstName}{e.LastName}") == normalized
            || NormalizePersonKey(e.LastName) == normalized
            || NormalizePersonKey(e.FirstName) == normalized);
    }

    private static string NormalizePersonKey(string? raw)
    {
        return string.IsNullOrWhiteSpace(raw)
            ? string.Empty
            : Regex.Replace(raw.ToUpperInvariant(), "[^A-Z0-9]", string.Empty);
    }

    private async Task<string?> LoadProcessingRulesJsonAsync(int departmentId, int projectId, CancellationToken cancellationToken)
    {
        return await _context.DataProcessingApis
            .Where(api => api.DepartmentId == departmentId && api.ProjectId == projectId && api.IsActive)
            .OrderByDescending(api => api.Id)
            .Select(api => api.RulesJson)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Project> EnsureProjectInDepartmentAsync(int departmentId, int projectId, CancellationToken cancellationToken)
    {
        var project = await _context.Projects
            .Include(p => p.BusinessUnit)
            .Include(p => p.Department)
            .FirstOrDefaultAsync(item => item.Id == projectId && item.DepartmentId == departmentId, cancellationToken);

        if (project == null)
        {
            throw new InvalidOperationException("Project was not found in your department.");
        }

        return project;
    }
}
