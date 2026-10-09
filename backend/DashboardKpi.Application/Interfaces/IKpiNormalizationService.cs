using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiNormalizationService
{
    IReadOnlyList<NormalizedKpiRecord> NormalizeRecords(
        IReadOnlyCollection<RawKpiRecord> rawRecords,
        string? rulesJson = null);
}
