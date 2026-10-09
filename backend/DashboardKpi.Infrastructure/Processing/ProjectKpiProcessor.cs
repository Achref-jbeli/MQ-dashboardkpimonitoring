using System.Data;
using System.Globalization;
using System.Text.RegularExpressions;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Processing;

public class ProjectKpiProcessor : IKpiProcessor
{
    private readonly ApplicationDbContext _context;

    public ProjectKpiProcessor(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Dictionary<string, decimal>> ProcessKpisAsync(
        IReadOnlyCollection<NormalizedKpiRecord> records,
        int departmentId,
        int? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var total = records.Count;
        var now = DateTime.UtcNow;

        var done = records.Count(r => IsDone(r));
        var delayed = records.Count(r => IsDelayed(r, now));
        var active = Math.Max(0, total - done);

        var progressValues = records
            .Where(r => r.Progress.HasValue)
            .Select(r => r.Progress!.Value)
            .ToList();

        var avgProgress = progressValues.Count > 0
            ? progressValues.Average()
            : (total == 0 ? 0m : Math.Round((decimal)done / total * 100m, 2));

        var scheduleAdherence = total == 0
            ? 0m
            : Math.Round(Math.Max(0m, 100m - ((decimal)delayed / total * 100m)), 2);

        var overallAchievement = total == 0
            ? 0m
            : Math.Round((decimal)done / total * 100m, 2);

        var overallMaturity = Math.Round(Math.Min(5m, avgProgress / 20m), 2);
        var projectHealth = Math.Round(Math.Max(0m, 100m - ((decimal)delayed / Math.Max(1, total) * 100m)), 2);
        var deliveryPerformance = scheduleAdherence;

        var baseMetrics = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["total_tasks"] = total,
            ["done_tasks"] = done,
            ["active_tasks"] = active,
            ["delayed_tasks"] = delayed,
            ["progress_pct"] = Math.Round(avgProgress, 2),
            ["schedule_adherence"] = scheduleAdherence,
            ["overall_kpi_achievement"] = overallAchievement,
            ["overall_maturity"] = overallMaturity,
            ["project_health"] = projectHealth,
            ["delivery_performance"] = deliveryPerformance,
        };

        // Check if custom calculation APIs exist for this project
        var calculationApis = projectId.HasValue
            ? await _context.DataCalculationApis
                .Where(api => api.DepartmentId == departmentId && api.ProjectId == projectId.Value && api.IsActive)
                .OrderBy(api => api.Id)
                .ToListAsync(cancellationToken)
            : [];

        var results = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        if (calculationApis.Count == 0)
        {
            results["Total Tasks"] = baseMetrics["total_tasks"];
            results["Completed Tasks"] = baseMetrics["done_tasks"];
            results["Active Tasks"] = baseMetrics["active_tasks"];
            results["Delayed Tasks"] = baseMetrics["delayed_tasks"];
            results["Progress"] = baseMetrics["progress_pct"];
            results["Schedule Adherence"] = baseMetrics["schedule_adherence"];
            results["Overall KPI Achievement"] = baseMetrics["overall_kpi_achievement"];
            results["Overall Maturity"] = baseMetrics["overall_maturity"];
            results["Project Health"] = baseMetrics["project_health"];
            results["Delivery Performance"] = baseMetrics["delivery_performance"];
        }
        else
        {
            foreach (var api in calculationApis)
            {
                var val = EvaluateFormulaExpression(api.FormulaExpression, baseMetrics);
                if (val.HasValue)
                {
                    results[api.KpiLabel] = Math.Round(val.Value, api.DecimalPlaces);
                }
            }
        }

        return results;
    }

    private static bool IsDone(NormalizedKpiRecord record)
    {
        if (record.CompletedDate.HasValue)
        {
            return true;
        }

        var status = record.Status;
        if (string.IsNullOrWhiteSpace(status))
        {
            return false;
        }

        return status.Contains("done", StringComparison.OrdinalIgnoreCase)
            || status.Contains("closed", StringComparison.OrdinalIgnoreCase)
            || status.Contains("resolved", StringComparison.OrdinalIgnoreCase)
            || status.Contains("completed", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDelayed(NormalizedKpiRecord record, DateTime nowUtc)
    {
        if (IsDone(record))
        {
            return false;
        }

        var status = record.Status;
        if (!string.IsNullOrWhiteSpace(status) && (
            status.Contains("delayed", StringComparison.OrdinalIgnoreCase)
            || status.Contains("blocked", StringComparison.OrdinalIgnoreCase)
            || status.Contains("on hold", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        if (record.DueDate.HasValue && record.DueDate.Value < nowUtc)
        {
            return true;
        }

        return false;
    }

    private static decimal? EvaluateFormulaExpression(string formulaExpression, IReadOnlyDictionary<string, decimal> metrics)
    {
        if (string.IsNullOrWhiteSpace(formulaExpression))
        {
            return null;
        }

        var expression = formulaExpression;
        foreach (var metric in metrics)
        {
            var pattern = $@"\b{Regex.Escape(metric.Key)}\b";
            expression = Regex.Replace(
                expression,
                pattern,
                metric.Value.ToString(CultureInfo.InvariantCulture),
                RegexOptions.IgnoreCase);
        }

        try
        {
            var table = new DataTable();
            var value = table.Compute(expression, string.Empty);
            return Convert.ToDecimal(value, CultureInfo.InvariantCulture);
        }
        catch
        {
            return null;
        }
    }
}
