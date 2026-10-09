using ClosedXML.Excel;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Extraction;
using DashboardKpi.Infrastructure.Formula;
using DashboardKpi.Infrastructure.Normalization;
using DashboardKpi.Infrastructure.Persistence;
using DashboardKpi.Infrastructure.Processing;
using DashboardKpi.Infrastructure.Services;
using Xunit;

namespace DashboardKpi.Api.Tests;

public class KpiPipelineTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly IFormulaTranslator _translator;
    private readonly IExcelFormulaProcessor _processor;

    public KpiPipelineTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _translator = new FormulaTranslator();
        _processor = new ExcelFormulaProcessor(_translator);
    }

    [Fact]
    public void FormulaTranslator_TranslatesFrenchFunctionsAndSemicolons()
    {
        var formula = "=SI(Q3=\"\";\"\";SI(ET(0<=AE3;AE3<16);1;0))";
        var translated = _translator.TranslateFrenchFormula(formula);

        Assert.Equal("IF(Q3=\"\",\"\",IF(AND(0<=AE3,AE3<16),1,0))", translated);
    }

    [Theory]
    [InlineData("=SI(Q3=\"\",\"\",SI(W3>=V3,0,1))", "2026-06-01", 10, 5, 0)] // W >= V => 0
    [InlineData("=SI(Q3=\"\",\"\",SI(W3>=V3,0,1))", "2026-06-01", 3, 5, 1)]  // W < V => 1
    [InlineData("=SI(Q3=\"\",\"\",SI(W3>=V3,0,1))", "", 10, 5, "")]           // Q is empty => ""
    public void ExcelFormulaProcessor_EvaluatesConditionFormula1(string formula, string qVal, int wVal, int vVal, object expected)
    {
        var row = new Dictionary<string, object?>
        {
            ["Q"] = qVal,
            ["W"] = wVal,
            ["V"] = vVal,
        };

        var result = _processor.EvaluateFormula(formula, row);

        if (expected is int expectedInt)
        {
            Assert.Equal((decimal)expectedInt, Convert.ToDecimal(result));
        }
        else
        {
            Assert.Equal(expected?.ToString(), result?.ToString());
        }
    }

    [Fact]
    public void ExcelFormulaProcessor_EvaluatesNetworkDaysFormulas()
    {
        // Monday June 8 to Friday June 12 = 5 working days. Networkdays(S, R) - 1 = 4.
        var row = new Dictionary<string, object?>
        {
            ["Q"] = "2026-06-01",
            ["S"] = "2026-06-08",
            ["R"] = "2026-06-12",
        };

        var formula = "=SI(Q3=\"\",\"\",SI(S3=\"\",\"\",NB.JOURS.OUVRES(S3,R3)-1))";
        var result = _processor.EvaluateFormula(formula, row);

        Assert.Equal(4m, Convert.ToDecimal(result));
    }

    [Fact]
    public void ExcelFormulaProcessor_EvaluatesMonthFormula()
    {
        var row = new Dictionary<string, object?>
        {
            ["Q"] = "2026-08-15",
        };

        var formula = "=SI(Q3=\"\",\"\",MOIS(Q3))";
        var result = _processor.EvaluateFormula(formula, row);

        Assert.Equal(8m, Convert.ToDecimal(result));
    }

    [Theory]
    [InlineData(-5, 1)]
    [InlineData(0, 0)]
    [InlineData(10, 0)]
    public void ExcelFormulaProcessor_EvaluatesDelayBacklogFormula(int yVal, int expected)
    {
        var row = new Dictionary<string, object?>
        {
            ["Z"] = "HasDelay",
            ["Y"] = yVal,
        };

        var formula = "=SI(Z3=\"\",\"\",SI(Y3<0,1,0))";
        var result = _processor.EvaluateFormula(formula, row);

        Assert.Equal((decimal)expected, Convert.ToDecimal(result));
    }

    [Theory]
    [InlineData(-5, 1)]  // AE < 0
    [InlineData(5, 0)]
    public void ExcelFormulaProcessor_EvaluatesNegativeThresholdFormula(int aeVal, int expected)
    {
        var row = new Dictionary<string, object?>
        {
            ["AE"] = aeVal,
        };

        var formula = "=SI(AE3=\"\",\"\",SI(AE3<0,1,0))";
        var result = _processor.EvaluateFormula(formula, row);

        Assert.Equal((decimal)expected, Convert.ToDecimal(result));
    }

    [Theory]
    [InlineData(0, 1)]   // 0 <= AE < 16 => 1
    [InlineData(10, 1)]  // 0 <= AE < 16 => 1
    [InlineData(16, 0)]  // AE >= 16 => 0
    [InlineData(-1, 0)]  // AE < 0 => 0
    public void ExcelFormulaProcessor_EvaluatesRange0To16Formula(int aeVal, int expected)
    {
        var row = new Dictionary<string, object?>
        {
            ["AE"] = aeVal,
        };

        var formula = "=SI(AE3=\"\",\"\",SI(ET(0<=AE3,AE3<16),1,0))";
        var result = _processor.EvaluateFormula(formula, row);

        Assert.Equal((decimal)expected, Convert.ToDecimal(result));
    }

    [Theory]
    [InlineData(16, 1)]  // 16 <= AE <= 55 => 1
    [InlineData(30, 1)]  // 16 <= AE <= 55 => 1
    [InlineData(55, 1)]  // 16 <= AE <= 55 => 1
    [InlineData(10, 0)]  // AE < 16 => 0
    [InlineData(60, 0)]  // AE > 55 => 0
    public void ExcelFormulaProcessor_EvaluatesRange16To55Formula(int aeVal, int expected)
    {
        var row = new Dictionary<string, object?>
        {
            ["AE"] = aeVal,
        };

        var formula = "=SI(AE3=\"\",\"\",SI(ET(16<=AE3,AE3<=55),1,0))";
        var result = _processor.EvaluateFormula(formula, row);

        Assert.Equal((decimal)expected, Convert.ToDecimal(result));
    }

    [Theory]
    [InlineData(60, 1)]  // AE > 55 => 1
    [InlineData(55, 0)]  // AE == 55 => 0
    [InlineData(20, 0)]  // AE < 55 => 0
    public void ExcelFormulaProcessor_EvaluatesAbove55Formula(int aeVal, int expected)
    {
        var row = new Dictionary<string, object?>
        {
            ["AE"] = aeVal,
        };

        var formula = "=SI(AE3=\"\",\"\",SI(AE3>55,1,0))";
        var result = _processor.EvaluateFormula(formula, row);

        Assert.Equal((decimal)expected, Convert.ToDecimal(result));
    }

    [Fact]
    public async Task ExcelKpiExtractor_ExtractsFormulasAndValuesCorrectly()
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("KPIs");

        // Headers
        ws.Cell("A1").Value = "Change No.";
        ws.Cell("B1").Value = "Tasks";
        ws.Cell("C1").Value = "Status";
        ws.Cell("D1").Value = "Progress";
        ws.Cell("E1").Value = "CalculatedScore";

        // Row 2
        ws.Cell("A2").Value = "CHG-100";
        ws.Cell("B2").Value = "Task Alpha";
        ws.Cell("C2").Value = "Done";
        ws.Cell("D2").Value = 100;
        ws.Cell("E2").FormulaA1 = "SI(D2>=80, 1, 0)";

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        ms.Position = 0;

        var extractor = new ExcelKpiExtractor();
        var records = await extractor.ExtractAsync(ms, "test.xlsx");

        Assert.Single(records);
        Assert.Equal("CHG-100", records[0].Values["Change No."]?.ToString());
        Assert.True(records[0].Formulas.ContainsKey("CalculatedScore") || records[0].Formulas.ContainsKey("E"));
    }

    [Fact]
    public void KpiNormalizationService_NormalizesRawRecordsWithFormulas()
    {
        var normalizer = new KpiNormalizationService(_processor);

        var raw = new RawKpiRecord
        {
            SourceType = "Excel",
            RowIndex = 3,
            Values = new Dictionary<string, object?>
            {
                ["Change No."] = "CHG-200",
                ["Status"] = "Completed",
                ["Progress"] = "95%",
                ["Bus. unit"] = "HMI",
                ["Q"] = "2026-06-01",
                ["W"] = 10,
                ["V"] = 5,
            },
            Formulas = new Dictionary<string, string?>
            {
                ["IsDelayed"] = "=SI(W3>=V3,0,1)",
            }
        };

        var normalized = normalizer.NormalizeRecords([raw]);

        Assert.Single(normalized);
        Assert.Equal("CHG-200", normalized[0].Identifier);
        Assert.Equal("Completed", normalized[0].Status);
        Assert.Equal(95m, normalized[0].Progress);
        Assert.Equal("HMI", normalized[0].BusinessUnit);
        Assert.True(normalized[0].AdditionalFields.ContainsKey("IsDelayed"));
        Assert.Equal(0m, Convert.ToDecimal(normalized[0].AdditionalFields["IsDelayed"]));
    }
}
