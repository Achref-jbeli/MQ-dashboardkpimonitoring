using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Services;

public class ExternalApiPipelineService : IExternalApiPipelineService
{
    private readonly IKpiImportOrchestrator _orchestrator;
    private readonly IKpiImportService _importService;

    public ExternalApiPipelineService(
        IKpiImportOrchestrator orchestrator,
        IKpiImportService importService)
    {
        _orchestrator = orchestrator;
        _importService = importService;
    }

    public Task<DataExtractionApi> CreateExtractionApiAsync(int departmentId, AddDataExtractionApiDto dto, CancellationToken cancellationToken = default)
        => _orchestrator.CreateExtractionApiAsync(departmentId, dto, cancellationToken);

    public Task<DataProcessingApi> CreateProcessingApiAsync(int departmentId, AddDataProcessingApiDto dto, CancellationToken cancellationToken = default)
        => _orchestrator.CreateProcessingApiAsync(departmentId, dto, cancellationToken);

    public Task<DataCalculationApi> CreateCalculationApiAsync(int departmentId, AddDataCalculationApiDto dto, CancellationToken cancellationToken = default)
        => _orchestrator.CreateCalculationApiAsync(departmentId, dto, cancellationToken);

    public Task<IReadOnlyCollection<ExternalApiSummaryDto>> GetProjectApisAsync(int departmentId, int projectId, CancellationToken cancellationToken = default)
        => _orchestrator.GetProjectApisAsync(departmentId, projectId, cancellationToken);

    public Task<KpiImportResultDto> ImportProjectKpisFromCsvAsync(int departmentId, ImportProjectKpiCsvDto dto, Stream csvStream, CancellationToken cancellationToken = default)
        => _importService.ImportFromFileAsync(departmentId, dto, csvStream, "import.csv", cancellationToken);

    public Task<KpiImportResultDto> ImportProjectKpisFromFileAsync(int departmentId, ImportProjectKpiCsvDto dto, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
        => _importService.ImportFromFileAsync(departmentId, dto, fileStream, fileName, cancellationToken);

    public Task<KpiImportResultDto> ImportProjectKpisFromJiraAsync(int departmentId, ImportProjectKpiJiraDto dto, CancellationToken cancellationToken = default)
        => _importService.ImportFromJiraAsync(departmentId, dto, cancellationToken);

    public Task<IReadOnlyList<MonthlyAdherenceDto>> GetMonthlyAdherenceAsync(
        int departmentId,
        int? projectId = null,
        string? businessUnit = null,
        int? year = null,
        IReadOnlyList<string>? responsibleDepartments = null,
        CancellationToken cancellationToken = default)
        => _importService.GetMonthlyAdherenceAsync(departmentId, projectId, businessUnit, year, responsibleDepartments, cancellationToken);
}
