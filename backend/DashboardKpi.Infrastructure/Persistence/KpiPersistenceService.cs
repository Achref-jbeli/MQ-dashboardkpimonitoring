using System.Text.Json;
using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Persistence;

public class KpiPersistenceService : IKpiPersistenceService
{
    private readonly ApplicationDbContext _context;

    public KpiPersistenceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<KpiImportResultDto> PersistImportAsync(
        int departmentId,
        int? projectId,
        string performanceUnit,
        string businessUnit,
        string sourceType,
        string? fileName,
        IReadOnlyList<NormalizedKpiRecord> records,
        IReadOnlyList<KpiCalculationResultDto> kpiResults,
        IReadOnlyList<KpiImportErrorDto> errors,
        CancellationToken cancellationToken = default)
    {
        var batch = new KpiImportBatch
        {
            DepartmentId = departmentId,
            ProjectId = projectId,
            SourceType = sourceType,
            FileName = fileName,
            ImportedAtUtc = DateTime.UtcNow,
            Status = errors.Count > 0 && records.Count == 0 ? "Failed" : (errors.Count > 0 ? "CompletedWithWarnings" : "Completed"),
            TotalRows = records.Count + errors.Count,
            SuccessfulRows = records.Count,
            FailedRows = errors.Count,
            ErrorMessage = errors.Count > 0 ? string.Join("; ", errors.Take(3).Select(e => $"Row {e.Row}: {e.Message}")) : null,
            DetailsJson = JsonSerializer.Serialize(new { errorsCount = errors.Count, kpisCalculated = kpiResults.Count }),
        };

        try
        {
            _context.KpiImportBatches.Add(batch);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Batch logging table fallback
        }

        var importedCount = 0;
        var updatedCount = 0;

        // 1. Persist Tasks Idempotently
        if (records.Count > 0)
        {
            var existingTasksQuery = _context.Tasks.Where(t => t.DepartmentId == departmentId);
            if (projectId.HasValue)
            {
                existingTasksQuery = existingTasksQuery.Where(t => t.ProjectId == projectId.Value);
            }

            var existingTasks = await existingTasksQuery.ToListAsync(cancellationToken);
            var existingTaskDict = new Dictionary<string, TaskItem>(StringComparer.OrdinalIgnoreCase);
            foreach (var t in existingTasks)
            {
                var k = (!string.IsNullOrWhiteSpace(t.ChangeNumber) ? t.ChangeNumber : t.Title)?.Trim().ToLowerInvariant();
                if (!string.IsNullOrWhiteSpace(k) && !existingTaskDict.ContainsKey(k))
                {
                    existingTaskDict[k] = t;
                }
            }

            foreach (var r in records)
            {
                var key = (!string.IsNullOrWhiteSpace(r.ChangeNumber) ? r.ChangeNumber : r.Title ?? string.Empty).Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(key)) continue;

                if (existingTaskDict.TryGetValue(key, out var existingTask))
                {
                    // Update existing
                    existingTask.Title = r.Title ?? existingTask.Title;
                    existingTask.Description = r.Description ?? existingTask.Description;
                    existingTask.Status = r.Status ?? existingTask.Status;
                    existingTask.Progress = r.Progress.HasValue ? (int)r.Progress.Value : existingTask.Progress;
                    existingTask.SendDate = r.SendDate ?? existingTask.SendDate;
                    existingTask.DueDate = r.DueDate ?? existingTask.DueDate;
                    existingTask.CompletedAt = r.CompletedDate ?? existingTask.CompletedAt;
                    existingTask.InitialDate = r.InitialDate ?? existingTask.InitialDate;
                    existingTask.AssigneeName = r.Assignee ?? existingTask.AssigneeName;
                    existingTask.WorkItem = r.WorkItem ?? existingTask.WorkItem;
                    existingTask.BusinessUnit = r.BusinessUnit ?? existingTask.BusinessUnit;
                    existingTask.SourceMonth = r.Month ?? existingTask.SourceMonth;
                    updatedCount++;
                }
                else
                {
                    // Insert new
                    var newTask = new TaskItem
                    {
                        DepartmentId = departmentId,
                        ProjectId = projectId,
                        Title = r.Title ?? "Untitled Task",
                        Description = r.Description,
                        ChangeNumber = r.ChangeNumber,
                        Status = r.Status ?? "Planned",
                        Progress = r.Progress.HasValue ? (int)r.Progress.Value : 0,
                        SendDate = r.SendDate,
                        DueDate = r.DueDate,
                        CompletedAt = r.CompletedDate,
                        InitialDate = r.InitialDate,
                        AssigneeName = r.Assignee,
                        ResponsibleName = r.ResponsibleName,
                        ResponsibleDepartment = r.ResponsibleDepartment,
                        WorkItem = r.WorkItem,
                        BusinessUnit = r.BusinessUnit ?? businessUnit,
                        SourceMonth = r.Month ?? "1",
                    };

                    _context.Tasks.Add(newTask);
                    existingTaskDict[key] = newTask;
                    importedCount++;
                }
            }
        }

        // 2. Persist Calculated KPIs Idempotently
        var existingKpis = await _context.Kpis
            .Where(k => k.DepartmentId == departmentId && (projectId.HasValue ? k.ProjectId == projectId.Value : k.ProjectId == null))
            .ToListAsync(cancellationToken);

        var existingKpiDict = new Dictionary<string, Kpi>(StringComparer.OrdinalIgnoreCase);
        foreach (var k in existingKpis)
        {
            var kpiKey = $"{k.Designation}|{k.Month ?? "1"}|{k.ProjectId?.ToString() ?? "none"}";
            if (!existingKpiDict.ContainsKey(kpiKey))
            {
                existingKpiDict[kpiKey] = k;
            }
        }

        foreach (var kpiRes in kpiResults)
        {
            foreach (var (month, monthData) in kpiRes.MonthlyBreakdown)
            {
                var kpiKey = $"{kpiRes.Name}|{month}|{projectId?.ToString() ?? "none"}";

                if (existingKpiDict.TryGetValue(kpiKey, out var existingKpi))
                {
                    existingKpi.CalculatedValue = monthData.AdherencePercentage;
                    existingKpi.AdherenceToSchedule = monthData.AdherencePercentage;
                    existingKpi.Green = monthData.GreenCount > 0;
                    existingKpi.Yellow = monthData.YellowCount > 0;
                    existingKpi.Orange = monthData.OrangeCount > 0;
                    existingKpi.Red = monthData.RedCount > 0;
                    existingKpi.Formula = kpiRes.Formula;
                    existingKpi.CalculatedAtUtc = DateTime.UtcNow;
                    existingKpi.BusinessUnit = businessUnit;
                }
                else
                {
                    var newKpi = new Kpi
                    {
                        DepartmentId = departmentId,
                        ProjectId = projectId,
                        Designation = kpiRes.Name,
                        CalculatedValue = monthData.AdherencePercentage,
                        AdherenceToSchedule = monthData.AdherencePercentage,
                        Green = monthData.GreenCount > 0,
                        Yellow = monthData.YellowCount > 0,
                        Orange = monthData.OrangeCount > 0,
                        Red = monthData.RedCount > 0,
                        Month = month,
                        SourceType = sourceType,
                        SourceIdentifier = fileName,
                        BusinessUnit = businessUnit,
                        Formula = kpiRes.Formula,
                        CalculatedAtUtc = DateTime.UtcNow,
                    };

                    _context.Kpis.Add(newKpi);
                    existingKpiDict[kpiKey] = newKpi;
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var aggregatedMetrics = kpiResults.FirstOrDefault()?.MetricVariables ?? new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        return new KpiImportResultDto
        {
            BatchId = batch.Id,
            Success = errors.Count == 0 || records.Count > 0,
            Status = batch.Status,
            DepartmentId = departmentId,
            ProjectId = projectId,
            PerformanceUnit = performanceUnit,
            BusinessUnit = businessUnit,
            TotalRows = records.Count + errors.Count,
            ImportedCount = importedCount,
            UpdatedCount = updatedCount,
            FailedCount = errors.Count,
            ImportedAtUtc = batch.ImportedAtUtc,
            Errors = errors.ToList(),
            CalculatedMetrics = aggregatedMetrics,
            KpiResults = kpiResults.ToList(),
        };
    }

    public async Task<KpiImportResultDto> PersistProjectKpisAsync(
        int departmentId,
        int projectId,
        string businessUnit,
        string sourceType,
        string? sourceIdentifier,
        Dictionary<string, decimal> metrics,
        IReadOnlyCollection<NormalizedKpiRecord>? records = null,
        CancellationToken cancellationToken = default)
    {
        var recs = records?.ToList() ?? new List<NormalizedKpiRecord>();
        var adherence = metrics.TryGetValue("schedule_adherence", out var val) ? val : 0m;

        var kpiResult = new KpiCalculationResultDto
        {
            Code = "ADHERENCE_TO_SCHEDULE",
            Name = "Adherence to Schedule",
            Value = adherence,
            TotalCount = recs.Count,
            GreenCount = recs.Count(r => r.IsGreen),
            YellowCount = recs.Count(r => r.IsYellow),
            OrangeCount = recs.Count(r => r.IsOrange),
            RedCount = recs.Count(r => r.IsRed),
            MetricVariables = metrics,
        };

        return await PersistImportAsync(
            departmentId,
            projectId,
            "Project",
            businessUnit,
            sourceType,
            sourceIdentifier,
            recs,
            [kpiResult],
            [],
            cancellationToken);
    }

    public async Task<KpiImportResultDto> PersistPerformanceKpisAsync(
        int departmentId,
        string performanceUnit,
        string businessUnit,
        string sourceType,
        string? sourceIdentifier,
        Dictionary<string, decimal> metrics,
        IReadOnlyCollection<NormalizedKpiRecord>? records = null,
        CancellationToken cancellationToken = default)
    {
        var recs = records?.ToList() ?? new List<NormalizedKpiRecord>();
        var adherence = metrics.TryGetValue("schedule_adherence", out var val) ? val : 0m;

        var kpiResult = new KpiCalculationResultDto
        {
            Code = "ADHERENCE_TO_SCHEDULE",
            Name = $"{performanceUnit} Adherence",
            Value = adherence,
            TotalCount = recs.Count,
            GreenCount = recs.Count(r => r.IsGreen),
            YellowCount = recs.Count(r => r.IsYellow),
            OrangeCount = recs.Count(r => r.IsOrange),
            RedCount = recs.Count(r => r.IsRed),
            MetricVariables = metrics,
        };

        return await PersistImportAsync(
            departmentId,
            null,
            performanceUnit,
            businessUnit,
            sourceType,
            sourceIdentifier,
            recs,
            [kpiResult],
            [],
            cancellationToken);
    }
}
