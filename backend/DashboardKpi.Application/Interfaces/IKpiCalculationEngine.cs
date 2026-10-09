using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiCalculationEngine
{
    Task<IReadOnlyList<KpiCalculationResultDto>> CalculateKpisAsync(
        IReadOnlyList<NormalizedKpiRecord> records,
        int departmentId,
        int? projectId = null,
        CancellationToken cancellationToken = default);

    IReadOnlyList<MonthlyAdherenceDto> ComputeMonthlyAdherence(
        IReadOnlyList<NormalizedKpiRecord> records,
        int? year = null);
}
