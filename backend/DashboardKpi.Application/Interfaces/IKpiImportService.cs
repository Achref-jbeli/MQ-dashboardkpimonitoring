using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Kpi;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiImportService
{
    Task<KpiImportResultDto> ImportFromFileAsync(
        int departmentId,
        ImportProjectKpiCsvDto dto,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default);

    Task<KpiImportResultDto> ImportFromJiraAsync(
        int departmentId,
        ImportProjectKpiJiraDto dto,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MonthlyAdherenceDto>> GetMonthlyAdherenceAsync(
        int departmentId,
        int? projectId = null,
        string? businessUnit = null,
        int? year = null,
        IReadOnlyList<string>? responsibleDepartments = null,
        CancellationToken cancellationToken = default);
}
