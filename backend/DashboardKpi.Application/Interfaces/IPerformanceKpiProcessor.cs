using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IPerformanceKpiProcessor
{
    Dictionary<string, decimal> CalculateTaskMetrics(IReadOnlyCollection<TaskItem> tasks);
}
