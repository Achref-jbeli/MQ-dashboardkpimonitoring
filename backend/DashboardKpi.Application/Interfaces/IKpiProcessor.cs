using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiProcessor
{
    Task<Dictionary<string, decimal>> ProcessKpisAsync(
        IReadOnlyCollection<NormalizedKpiRecord> records,
        int departmentId,
        int? projectId = null,
        CancellationToken cancellationToken = default);
}
