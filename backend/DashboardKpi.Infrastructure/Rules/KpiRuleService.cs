using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DashboardKpi.Infrastructure.Rules;

public class KpiRuleService : IKpiRuleService
{
    private readonly ApplicationDbContext _context;

    public KpiRuleService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<KpiDefinition>> GetDepartmentKpiDefinitionsAsync(
        int departmentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var definitions = await _context.KpiDefinitions
                .Where(k => (k.DepartmentId == departmentId || k.DepartmentId == null) && k.IsActive)
                .OrderByDescending(k => k.DepartmentId)
                .ToListAsync(cancellationToken);

            if (definitions.Count > 0)
            {
                return definitions;
            }

            var defaultDef = CreateDefaultDefinition(departmentId);
            try
            {
                _context.KpiDefinitions.Add(defaultDef);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                // In-memory fallback if write fails
            }

            return [defaultDef];
        }
        catch
        {
            return [CreateDefaultDefinition(departmentId)];
        }
    }

    public async Task<KpiDefinition> SaveKpiDefinitionAsync(
        KpiDefinition definition,
        CancellationToken cancellationToken = default)
    {
        if (definition.Id > 0)
        {
            definition.UpdatedAtUtc = DateTime.UtcNow;
            _context.KpiDefinitions.Update(definition);
        }
        else
        {
            definition.CreatedAtUtc = DateTime.UtcNow;
            _context.KpiDefinitions.Add(definition);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return definition;
    }

    private static KpiDefinition CreateDefaultDefinition(int departmentId)
    {
        return new KpiDefinition
        {
            DepartmentId = departmentId,
            Code = "ADHERENCE_TO_SCHEDULE",
            Name = "Adherence to Schedule",
            Description = "Percentage of scheduled milestones/tasks completed on or before target dates.",
            FormulaExpression = "(green_count + yellow_count) / total_tasks * 100",
            Unit = "%",
            DecimalPlaces = 2,
            GreenThreshold = 80m,
            YellowThreshold = 60m,
            OrangeThreshold = 40m,
            RedThreshold = 0m,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
        };
    }
}
