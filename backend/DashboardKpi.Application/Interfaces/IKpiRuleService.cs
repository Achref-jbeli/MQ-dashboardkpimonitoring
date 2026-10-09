using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiRuleService
{
    Task<IReadOnlyList<KpiDefinition>> GetDepartmentKpiDefinitionsAsync(
        int departmentId,
        CancellationToken cancellationToken = default);

    Task<KpiDefinition> SaveKpiDefinitionAsync(
        KpiDefinition definition,
        CancellationToken cancellationToken = default);
}
