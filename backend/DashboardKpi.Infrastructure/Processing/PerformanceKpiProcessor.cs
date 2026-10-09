using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Processing;

public class PerformanceKpiProcessor : IPerformanceKpiProcessor
{
    public Dictionary<string, decimal> CalculateTaskMetrics(IReadOnlyCollection<TaskItem> tasks)
    {
        var total = tasks.Count;
        var completed = tasks.Count(t => string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase));
        var delayed = tasks.Count(t => string.Equals(t.Status, "Delayed", StringComparison.OrdinalIgnoreCase));
        var active = tasks.Count(t => string.Equals(t.Status, "Active", StringComparison.OrdinalIgnoreCase) || string.Equals(t.Status, "Open", StringComparison.OrdinalIgnoreCase));

        var avgProgress = total == 0 ? 0m : Math.Round(tasks.Average(t => (decimal)t.Progress), 2);
        var scheduleAdherence = total == 0 ? 0m : Math.Round((decimal)tasks.Count(t => t.CompletedAt.HasValue && (!t.DueDate.HasValue || t.CompletedAt.Value <= t.DueDate.Value)) / total * 100m, 2);
        var performance = total == 0 ? 0m : Math.Round(tasks.Average(t => (decimal)t.PerformanceScore), 2);

        return new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["Total Tasks"] = total,
            ["Completed Tasks"] = completed,
            ["Active Tasks"] = active,
            ["Delayed Tasks"] = delayed,
            ["Progress"] = avgProgress,
            ["Schedule Adherence"] = scheduleAdherence,
            ["Overall KPI Achievement"] = total == 0 ? 0m : Math.Round((decimal)completed / total * 100m, 2),
            ["Overall Maturity"] = Math.Round(Math.Min(5m, performance / 20m), 2),
            ["Project Health"] = performance,
            ["Delivery Performance"] = scheduleAdherence,
        };
    }
}
