using DashboardKpi.Application.Interfaces;
using DashboardKpi.Infrastructure.Calculation;
using DashboardKpi.Infrastructure.Extraction;
using DashboardKpi.Infrastructure.Formula;
using DashboardKpi.Infrastructure.Import;
using DashboardKpi.Infrastructure.Normalization;
using DashboardKpi.Infrastructure.Persistence;
using DashboardKpi.Infrastructure.Processing;
using DashboardKpi.Infrastructure.Rules;
using DashboardKpi.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace DashboardKpi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddKpiPipeline(this IServiceCollection services)
    {
        services.AddSingleton<IFormulaTranslator, FormulaTranslator>();
        services.AddSingleton<IExcelFormulaProcessor, ExcelFormulaProcessor>();

        // Extraction and Import Adapters
        services.AddScoped<ExcelKpiExtractor>();
        services.AddScoped<CsvKpiExtractor>();
        services.AddHttpClient<IJiraKpiExtractor, JiraKpiExtractor>();
        services.AddScoped<IExcelKpiImporter, ExcelKpiImporter>();
        services.AddScoped<IJiraKpiImporter, JiraKpiImporter>();

        // Rule, Calculation & Persistence Services
        services.AddScoped<IKpiRuleService, KpiRuleService>();
        services.AddScoped<IKpiCalculationEngine, KpiCalculationEngine>();
        services.AddScoped<IKpiNormalizationService, KpiNormalizationService>();
        services.AddScoped<IKpiPersistenceService, KpiPersistenceService>();
        services.AddScoped<IKpiImportService, KpiImportService>();

        // Legacy / Orchestration Adapters
        services.AddScoped<IKpiProcessor, ProjectKpiProcessor>();
        services.AddScoped<IPerformanceKpiProcessor, PerformanceKpiProcessor>();
        services.AddScoped<IKpiImportOrchestrator, KpiImportOrchestrator>();
        services.AddScoped<IExternalApiPipelineService, ExternalApiPipelineService>();

        return services;
    }
}
