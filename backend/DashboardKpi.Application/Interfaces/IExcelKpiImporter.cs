using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IExcelKpiImporter
{
    Task<(IReadOnlyList<NormalizedKpiRecord> Records, IReadOnlyList<KpiImportErrorDto> Errors)> ImportAsync(
        Stream stream,
        string fileName,
        int departmentId,
        int? projectId = null,
        string? businessUnit = null,
        CancellationToken cancellationToken = default);
}
