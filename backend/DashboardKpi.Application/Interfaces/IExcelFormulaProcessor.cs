namespace DashboardKpi.Application.Interfaces;

public interface IExcelFormulaProcessor
{
    object? EvaluateFormula(
        string formula,
        IReadOnlyDictionary<string, object?> rowValues,
        int? currentRowIndex = null);
}
