using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiImportOrchestrator
{
    Task<DataExtractionApi> CreateExtractionApiAsync(int departmentId, AddDataExtractionApiDto dto, CancellationToken cancellationToken = default);

    Task<DataProcessingApi> CreateProcessingApiAsync(int departmentId, AddDataProcessingApiDto dto, CancellationToken cancellationToken = default);

    Task<DataCalculationApi> CreateCalculationApiAsync(int departmentId, AddDataCalculationApiDto dto, CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<ExternalApiSummaryDto>> GetProjectApisAsync(int departmentId, int projectId, CancellationToken cancellationToken = default);

    Task<KpiImportResultDto> ImportProjectKpisFromFileAsync(int departmentId, ImportProjectKpiCsvDto dto, Stream fileStream, string fileName, CancellationToken cancellationToken = default);

    Task<KpiImportResultDto> ImportProjectKpisFromCsvAsync(int departmentId, ImportProjectKpiCsvDto dto, Stream csvStream, CancellationToken cancellationToken = default);

    Task<KpiImportResultDto> ImportProjectKpisFromJiraAsync(int departmentId, ImportProjectKpiJiraDto dto, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Dtos.Kpi.MonthlyAdherenceDto>> GetMonthlyAdherenceAsync(
        int departmentId,
        int? projectId = null,
        string? businessUnit = null,
        int? year = null,
        IReadOnlyList<string>? responsibleDepartments = null,
        CancellationToken cancellationToken = default);
}
