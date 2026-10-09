using System.Globalization;
using System.Text.RegularExpressions;
using DashboardKpi.Application.Dtos.Kpi;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Calculation;

public class KpiCalculationEngine : IKpiCalculationEngine
{
    private readonly IKpiRuleService _ruleService;

    public KpiCalculationEngine(IKpiRuleService ruleService)
    {
        _ruleService = ruleService;
    }

    public async Task<IReadOnlyList<KpiCalculationResultDto>> CalculateKpisAsync(
        IReadOnlyList<NormalizedKpiRecord> records,
        int departmentId,
        int? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var definitions = await _ruleService.GetDepartmentKpiDefinitionsAsync(departmentId, cancellationToken);
        var results = new List<KpiCalculationResultDto>();

        var metrics = ComputeAggregateMetrics(records);
        var monthlyBreakdown = ComputeMonthlyAdherence(records);
        var monthDict = monthlyBreakdown.ToDictionary(m => m.Month, StringComparer.OrdinalIgnoreCase);

        foreach (var def in definitions)
        {
            var calculatedVal = EvaluateExpression(def.FormulaExpression, metrics);
            calculatedVal = Math.Round(calculatedVal, def.DecimalPlaces);

            var result = new KpiCalculationResultDto
            {
                Code = def.Code,
                Name = def.Name,
                Value = calculatedVal,
                Unit = def.Unit,
                GreenCount = (int)metrics["green_count"],
                YellowCount = (int)metrics["yellow_count"],
                OrangeCount = (int)metrics["orange_count"],
                RedCount = (int)metrics["red_count"],
                TotalCount = (int)metrics["total_tasks"],
                Formula = def.FormulaExpression,
                MetricVariables = metrics,
                MonthlyBreakdown = monthDict,
            };

            results.Add(result);
        }

        return results;
    }

    public IReadOnlyList<MonthlyAdherenceDto> ComputeMonthlyAdherence(
        IReadOnlyList<NormalizedKpiRecord> records,
        int? year = null)
    {
        var filtered = records.AsEnumerable();
        if (year.HasValue)
        {
            var yearStr = year.Value.ToString();
            filtered = filtered.Where(r => r.CreatedDate?.Year == year.Value || (r.Month != null && r.Month.StartsWith(yearStr)));
        }

        var monthDict = new Dictionary<string, (int green, int yellow, int orange, int red, int total)>(StringComparer.OrdinalIgnoreCase);

        foreach (var r in filtered)
        {
            var monthKey = NormalizeMonthKey(r.Month);
            if (!monthDict.TryGetValue(monthKey, out var existing))
            {
                existing = (0, 0, 0, 0, 0);
            }

            monthDict[monthKey] = (
                existing.green + (r.IsGreen ? 1 : 0),
                existing.yellow + (r.IsYellow ? 1 : 0),
                existing.orange + (r.IsOrange ? 1 : 0),
                existing.red + (r.IsRed ? 1 : 0),
                existing.total + 1
            );
        }

        var results = new List<MonthlyAdherenceDto>();

        // Months 1 to 12
        for (var m = 1; m <= 12; m++)
        {
            var monthKey = m.ToString();
            monthDict.TryGetValue(monthKey, out var val);

            var totalCount = val.green + val.yellow + val.orange + val.red;
            totalCount = Math.Max(totalCount, val.total);

            var greenPct = totalCount > 0 ? Math.Round((decimal)val.green / totalCount * 100m, 2) : 0m;
            var yellowPct = totalCount > 0 ? Math.Round((decimal)val.yellow / totalCount * 100m, 2) : 0m;
            var orangePct = totalCount > 0 ? Math.Round((decimal)val.orange / totalCount * 100m, 2) : 0m;
            var redPct = totalCount > 0 ? Math.Round((decimal)val.red / totalCount * 100m, 2) : 0m;

            results.Add(new MonthlyAdherenceDto
            {
                Month = monthKey,
                GreenCount = val.green,
                YellowCount = val.yellow,
                OrangeCount = val.orange,
                RedCount = val.red,
                TotalCount = totalCount,
                GreenPercentage = greenPct,
                YellowPercentage = yellowPct,
                OrangePercentage = orangePct,
                RedPercentage = redPct,
                AdherencePercentage = greenPct + yellowPct,
                AdherenceCount = val.green + val.yellow,
            });
        }

        // Grand total
        var grandGreen = results.Sum(r => r.GreenCount);
        var grandYellow = results.Sum(r => r.YellowCount);
        var grandOrange = results.Sum(r => r.OrangeCount);
        var grandRed = results.Sum(r => r.RedCount);
        var grandTotal = grandGreen + grandYellow + grandOrange + grandRed;

        var grandGreenPct = grandTotal > 0 ? Math.Round((decimal)grandGreen / grandTotal * 100m, 2) : 0m;
        var grandYellowPct = grandTotal > 0 ? Math.Round((decimal)grandYellow / grandTotal * 100m, 2) : 0m;
        var grandOrangePct = grandTotal > 0 ? Math.Round((decimal)grandOrange / grandTotal * 100m, 2) : 0m;
        var grandRedPct = grandTotal > 0 ? Math.Round((decimal)grandRed / grandTotal * 100m, 2) : 0m;

        results.Add(new MonthlyAdherenceDto
        {
            Month = "TOTAL GÉNÉRAL",
            GreenCount = grandGreen,
            YellowCount = grandYellow,
            OrangeCount = grandOrange,
            RedCount = grandRed,
            TotalCount = grandTotal,
            GreenPercentage = grandGreenPct,
            YellowPercentage = grandYellowPct,
            OrangePercentage = grandOrangePct,
            RedPercentage = grandRedPct,
            AdherencePercentage = grandGreenPct + grandYellowPct,
            AdherenceCount = grandGreen + grandYellow,
        });

        return results;
    }

    private static Dictionary<string, decimal> ComputeAggregateMetrics(IReadOnlyList<NormalizedKpiRecord> records)
    {
        var total = records.Count;
        var green = records.Count(r => r.IsGreen);
        var yellow = records.Count(r => r.IsYellow);
        var orange = records.Count(r => r.IsOrange);
        var red = records.Count(r => r.IsRed);
        var done = records.Count(r => string.Equals(r.Status, "Done", StringComparison.OrdinalIgnoreCase));
        var active = records.Count(r => !string.Equals(r.Status, "Done", StringComparison.OrdinalIgnoreCase));
        var delayed = orange + red;
        var onTime = green;

        var avgProgress = total > 0 ? records.Average(r => r.Progress ?? 0m) : 0m;
        var leadTimes = records.Where(r => r.LeadTimeDays.HasValue).Select(r => (decimal)r.LeadTimeDays!.Value).ToList();
        var avgLeadTime = leadTimes.Count > 0 ? leadTimes.Average() : 0m;

        var delays = records.Where(r => r.DelayDays.HasValue && r.DelayDays.Value > 0).Select(r => (decimal)r.DelayDays!.Value).ToList();
        var avgDelay = delays.Count > 0 ? delays.Average() : 0m;

        var scheduleAdherence = total > 0 ? ((decimal)(green + yellow) / total) * 100m : 0m;

        return new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["total_tasks"] = total,
            ["Total Tasks"] = total,
            ["total_count"] = total,
            ["Total Count"] = total,
            ["scheduled_tasks"] = total,
            ["Scheduled Tasks"] = total,
            ["total_due_tasks"] = total,
            ["Total Due Tasks"] = total,
            ["done_tasks"] = done,
            ["Done Tasks"] = done,
            ["completed_tasks"] = done,
            ["Completed Tasks"] = done,
            ["active_tasks"] = active,
            ["Active Tasks"] = active,
            ["delayed_tasks"] = delayed,
            ["Delayed Tasks"] = delayed,
            ["late_tasks"] = delayed,
            ["Late Tasks"] = delayed,
            ["on_time_tasks"] = onTime,
            ["On Time Tasks"] = onTime,
            ["on_time_completed"] = onTime,
            ["On Time Completed"] = onTime,
            ["completed_before_due_date"] = onTime,
            ["Completed Before Due Date"] = onTime,
            ["green_count"] = green,
            ["Green Count"] = green,
            ["yellow_count"] = yellow,
            ["Yellow Count"] = yellow,
            ["orange_count"] = orange,
            ["Orange Count"] = orange,
            ["red_count"] = red,
            ["Red Count"] = red,
            ["progress_pct"] = Math.Round(avgProgress, 2),
            ["Progress Pct"] = Math.Round(avgProgress, 2),
            ["schedule_adherence"] = Math.Round(scheduleAdherence, 2),
            ["Schedule Adherence"] = Math.Round(scheduleAdherence, 2),
            ["overall_maturity"] = Math.Round(scheduleAdherence, 2),
            ["Overall Maturity"] = Math.Round(scheduleAdherence, 2),
            ["overall_kpi_achievement"] = Math.Round(scheduleAdherence, 2),
            ["Overall Kpi Achievement"] = Math.Round(scheduleAdherence, 2),
            ["average_lead_time"] = Math.Round(avgLeadTime, 2),
            ["Average Lead Time"] = Math.Round(avgLeadTime, 2),
            ["average_delay"] = Math.Round(avgDelay, 2),
            ["Average Delay"] = Math.Round(avgDelay, 2),
        };
    }

    public static decimal EvaluateExpression(string? expression, Dictionary<string, decimal> metrics)
    {
        if (string.IsNullOrWhiteSpace(expression))
        {
            // Default adherence metric
            return metrics.TryGetValue("schedule_adherence", out var val) ? val : 0m;
        }

        try
        {
            var cleanExpr = expression.Trim();

            // Replace metric variable names with numeric values
            foreach (var (k, v) in metrics.OrderByDescending(kv => kv.Key.Length))
            {
                var pattern = $@"\b{Regex.Escape(k)}\b";
                cleanExpr = Regex.Replace(cleanExpr, pattern, v.ToString(CultureInfo.InvariantCulture), RegexOptions.IgnoreCase);
            }

            return EvaluateSimpleMath(cleanExpr);
        }
        catch
        {
            return 0m;
        }
    }

    private static decimal EvaluateSimpleMath(string expr)
    {
        expr = expr.Replace(" ", "");
        if (string.IsNullOrWhiteSpace(expr)) return 0m;

        // Recursive parentheses resolution
        while (expr.Contains('('))
        {
            var open = expr.LastIndexOf('(');
            var close = expr.IndexOf(')', open);
            if (close == -1) break;

            var inner = expr.Substring(open + 1, close - open - 1);
            var val = EvaluateSimpleMath(inner);
            expr = expr.Substring(0, open) + val.ToString(CultureInfo.InvariantCulture) + expr.Substring(close + 1);
        }

        // Addition and Subtraction
        for (var i = expr.Length - 1; i >= 0; i--)
        {
            var c = expr[i];
            if (c == '+' && i > 0 && !IsOperator(expr[i - 1]))
            {
                return EvaluateSimpleMath(expr.Substring(0, i)) + EvaluateSimpleMath(expr.Substring(i + 1));
            }
            if (c == '-' && i > 0 && !IsOperator(expr[i - 1]))
            {
                return EvaluateSimpleMath(expr.Substring(0, i)) - EvaluateSimpleMath(expr.Substring(i + 1));
            }
        }

        // Multiplication and Division
        for (var i = expr.Length - 1; i >= 0; i--)
        {
            var c = expr[i];
            if (c == '*')
            {
                return EvaluateSimpleMath(expr.Substring(0, i)) * EvaluateSimpleMath(expr.Substring(i + 1));
            }
            if (c == '/')
            {
                var divisor = EvaluateSimpleMath(expr.Substring(i + 1));
                if (divisor == 0m) return 0m; // Division by zero protection
                return EvaluateSimpleMath(expr.Substring(0, i)) / divisor;
            }
        }

        if (decimal.TryParse(expr, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
        {
            return parsed;
        }

        return 0m;
    }

    private static bool IsOperator(char c) => c is '+' or '-' or '*' or '/';

    private static string NormalizeMonthKey(string? rawMonth)
    {
        if (string.IsNullOrWhiteSpace(rawMonth)) return "1";
        rawMonth = rawMonth.Trim();

        if (int.TryParse(rawMonth, out var m) && m >= 1 && m <= 12)
        {
            return m.ToString();
        }

        if (DateTime.TryParse(rawMonth, out var dt))
        {
            return dt.Month.ToString();
        }

        var match = Regex.Match(rawMonth, @"\b(1[0-2]|[1-9])\b");
        if (match.Success)
        {
            return match.Value;
        }

        return rawMonth;
    }
}
