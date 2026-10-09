using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IJiraKpiExtractor
{
    Task<IReadOnlyList<RawKpiRecord>> ExtractAsync(
        DataExtractionApi extractionApi,
        string? jql,
        string? apiKey = null,
        CancellationToken cancellationToken = default);
}
