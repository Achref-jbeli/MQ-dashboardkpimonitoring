using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiPersistenceService
{
    Task<KpiImportResultDto> PersistImportAsync(
        int departmentId,
        int? projectId,
        string performanceUnit,
        string businessUnit,
        string sourceType,
        string? fileName,
        IReadOnlyList<NormalizedKpiRecord> records,
        IReadOnlyList<KpiCalculationResultDto> kpiResults,
        IReadOnlyList<KpiImportErrorDto> errors,
        CancellationToken cancellationToken = default);

    Task<KpiImportResultDto> PersistProjectKpisAsync(
        int departmentId,
        int projectId,
        string businessUnit,
        string sourceType,
        string? sourceIdentifier,
        Dictionary<string, decimal> metrics,
        IReadOnlyCollection<NormalizedKpiRecord>? records = null,
        CancellationToken cancellationToken = default);

    Task<KpiImportResultDto> PersistPerformanceKpisAsync(
        int departmentId,
        string performanceUnit,
        string businessUnit,
        string sourceType,
        string? sourceIdentifier,
        Dictionary<string, decimal> metrics,
        IReadOnlyCollection<NormalizedKpiRecord>? records = null,
        CancellationToken cancellationToken = default);
}
