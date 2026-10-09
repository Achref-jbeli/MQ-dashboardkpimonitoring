using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IJiraKpiImporter
{
    Task<(IReadOnlyList<NormalizedKpiRecord> Records, IReadOnlyList<KpiImportErrorDto> Errors)> ImportAsync(
        DataExtractionApi config,
        string? jql,
        string? apiKey,
        int departmentId,
        int projectId,
        CancellationToken cancellationToken = default);
}
