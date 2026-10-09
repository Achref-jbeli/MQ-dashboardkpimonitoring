using ClosedXML.Excel;
using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Calculation;
using DashboardKpi.Infrastructure.Data;
using DashboardKpi.Infrastructure.Import;
using DashboardKpi.Infrastructure.Persistence;
using DashboardKpi.Infrastructure.Rules;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DashboardKpi.Api.Tests;

public class KpiImportEngineTests
{
    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task ExcelImporter_HandlesFormulas_WithoutCrashing()
    {
        // Arrange
        using var stream = new MemoryStream();
        using (var workbook = new XLWorkbook())
        {
            var ws = workbook.Worksheets.Add("Tasks");
            ws.Cell(1, 1).Value = "Change No.";
            ws.Cell(1, 2).Value = "Tasks";
            ws.Cell(1, 3).Value = "Send date";
            ws.Cell(1, 4).Value = "End date";
            ws.Cell(1, 5).Value = "Done";
            ws.Cell(1, 6).Value = "adh to schedule";

            // Row 2
            ws.Cell(2, 1).Value = "CHG-001";
            ws.Cell(2, 2).Value = "Design Review";
            ws.Cell(2, 3).Value = new DateTime(2026, 1, 10);
            ws.Cell(2, 4).Value = new DateTime(2026, 1, 20);
            ws.Cell(2, 5).Value = new DateTime(2026, 1, 18);
            ws.Cell(2, 6).FormulaA1 = "=IF(E2<=D2, 1, 0)"; // Excel formula

            // Row 3
            ws.Cell(3, 1).Value = "CHG-002";
            ws.Cell(3, 2).Value = "Implementation";
            ws.Cell(3, 3).Value = new DateTime(2026, 1, 15);
            ws.Cell(3, 4).Value = new DateTime(2026, 1, 25);
            ws.Cell(3, 5).Value = new DateTime(2026, 1, 30);
            ws.Cell(3, 6).FormulaA1 = "=SI(E3<=D3, 100, 0)"; // French formula

            workbook.SaveAs(stream);
        }

        stream.Position = 0;
        var importer = new ExcelKpiImporter();

        // Act
        var (records, errors) = await importer.ImportAsync(stream, "tasks.xlsx", 1, null, "R&D");

        // Assert
        Assert.Empty(errors);
        Assert.Equal(2, records.Count);
        Assert.Equal("CHG-001", records[0].ChangeNumber);
        Assert.True(records[0].IsGreen); // Completed before due date
        Assert.True(records[1].IsYellow); // Completed after due date
    }

    [Fact]
    public async Task CalculationEngine_AppliesConfigurableDepartmentFormulas()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ruleService = new KpiRuleService(context);
        var engine = new KpiCalculationEngine(ruleService);

        // Department 1: (green_count + yellow_count) / total_tasks * 100
        await ruleService.SaveKpiDefinitionAsync(new KpiDefinition
        {
            DepartmentId = 1,
            Code = "ADHERENCE_TO_SCHEDULE",
            Name = "Adherence to Schedule",
            FormulaExpression = "(green_count + yellow_count) / total_tasks * 100",
            DecimalPlaces = 2
        });

        // Department 2: (on_time_tasks / total_tasks) * 100
        await ruleService.SaveKpiDefinitionAsync(new KpiDefinition
        {
            DepartmentId = 2,
            Code = "ADHERENCE_TO_SCHEDULE",
            Name = "Strict Adherence",
            FormulaExpression = "(on_time_tasks / total_tasks) * 100",
            DecimalPlaces = 2
        });

        var records = new List<NormalizedKpiRecord>
        {
            new() { IsGreen = true, Status = "Done", Month = "1" },
            new() { IsGreen = true, Status = "Done", Month = "1" },
            new() { IsYellow = true, Status = "Done", Month = "1" },
            new() { IsRed = true, Status = "InProgress", Month = "1" }
        }; // total = 4, green = 2, yellow = 1, red = 1

        // Act
        var resultsDept1 = await engine.CalculateKpisAsync(records, 1);
        var resultsDept2 = await engine.CalculateKpisAsync(records, 2);

        // Assert
        Assert.Equal(75.0m, resultsDept1[0].Value); // (2+1)/4 * 100 = 75%
        Assert.Equal(50.0m, resultsDept2[0].Value); // (2)/4 * 100 = 50%
    }

    [Fact]
    public void CalculationEngine_HandlesDivisionByZero_Gracefully()
    {
        // Arrange
        var emptyMetrics = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["total_tasks"] = 0m,
            ["green_count"] = 0m
        };

        // Act
        var val = KpiCalculationEngine.EvaluateExpression("(green_count / total_tasks) * 100", emptyMetrics);

        // Assert
        Assert.Equal(0m, val);
    }

    [Fact]
    public async Task PersistenceService_IsIdempotent_OnRepeatedImports()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var persistenceService = new KpiPersistenceService(context);

        var records = new List<NormalizedKpiRecord>
        {
            new()
            {
                ChangeNumber = "CHG-999",
                Title = "Task 999",
                Status = "Done",
                Progress = 100m,
                Month = "1",
                IsGreen = true,
                SendDate = new DateTime(2026, 1, 5),
                DueDate = new DateTime(2026, 1, 15),
                CompletedDate = new DateTime(2026, 1, 14)
            }
        };

        var kpiResult = new KpiCalculationResultDto
        {
            Code = "ADHERENCE_TO_SCHEDULE",
            Name = "Adherence to Schedule",
            Value = 100m,
            MonthlyBreakdown = new Dictionary<string, MonthlyAdherenceDto>
            {
                ["1"] = new() { Month = "1", GreenCount = 1, TotalCount = 1, AdherencePercentage = 100m }
            }
        };

        // Act 1 - First Import
        var res1 = await persistenceService.PersistImportAsync(
            1, null, "Performance", "R&D", "Excel", "file.xlsx", records, [kpiResult], []);

        // Act 2 - Second Import with same data
        var res2 = await persistenceService.PersistImportAsync(
            1, null, "Performance", "R&D", "Excel", "file.xlsx", records, [kpiResult], []);

        // Assert
        Assert.Equal(1, await context.Tasks.CountAsync(t => t.DepartmentId == 1));
        Assert.Equal(1, await context.Kpis.CountAsync(k => k.DepartmentId == 1));
        Assert.Equal(1, res1.ImportedCount);
        Assert.Equal(1, res2.UpdatedCount);
    }
}
