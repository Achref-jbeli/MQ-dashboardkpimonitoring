using System.Text;
using System.Text.RegularExpressions;
using DashboardKpi.Application.Interfaces;

namespace DashboardKpi.Infrastructure.Formula;

public class FormulaTranslator : IFormulaTranslator
{
    private static readonly (Regex Pattern, string Replacement)[] FunctionRules =
    [
        (new Regex(@"\bNB\.JOURS\.OUVRES\b", RegexOptions.IgnoreCase | RegexOptions.Compiled), "NETWORKDAYS"),
        (new Regex(@"\bMOIS\b", RegexOptions.IgnoreCase | RegexOptions.Compiled), "MONTH"),
        (new Regex(@"\bSI\b", RegexOptions.IgnoreCase | RegexOptions.Compiled), "IF"),
        (new Regex(@"\bET\b", RegexOptions.IgnoreCase | RegexOptions.Compiled), "AND"),
        (new Regex(@"\bOU\b", RegexOptions.IgnoreCase | RegexOptions.Compiled), "OR"),
    ];

    public string TranslateFrenchFormula(string formula)
    {
        if (string.IsNullOrWhiteSpace(formula))
        {
            return string.Empty;
        }

        var trimmed = formula.Trim();
        if (trimmed.StartsWith("="))
        {
            trimmed = trimmed[1..].Trim();
        }

        // Replace French function names outside of string literals
        var translated = ReplaceFunctionsOutsideStrings(trimmed);

        // Normalize semicolons used as argument separators in French Excel to commas
        translated = ReplaceSemicolonsOutsideStrings(translated);

        return translated;
    }

    private static string ReplaceFunctionsOutsideStrings(string input)
    {
        var tokens = SplitFormulaByStrings(input);
        var sb = new StringBuilder();

        foreach (var (text, isStringLiteral) in tokens)
        {
            if (isStringLiteral)
            {
                sb.Append(text);
            }
            else
            {
                var replaced = text;
                foreach (var (pattern, replacement) in FunctionRules)
                {
                    replaced = pattern.Replace(replaced, replacement);
                }
                sb.Append(replaced);
            }
        }

        return sb.ToString();
    }

    private static string ReplaceSemicolonsOutsideStrings(string input)
    {
        var tokens = SplitFormulaByStrings(input);
        var sb = new StringBuilder();

        foreach (var (text, isStringLiteral) in tokens)
        {
            if (isStringLiteral)
            {
                sb.Append(text);
            }
            else
            {
                sb.Append(text.Replace(';', ','));
            }
        }

        return sb.ToString();
    }

    private static List<(string Text, bool IsStringLiteral)> SplitFormulaByStrings(string input)
    {
        var result = new List<(string Text, bool IsStringLiteral)>();
        var current = new StringBuilder();
        var inString = false;

        for (var i = 0; i < input.Length; i++)
        {
            var c = input[i];

            if (c == '"')
            {
                if (inString)
                {
                    // Check for escaped quote in Excel ("")
                    if (i + 1 < input.Length && input[i + 1] == '"')
                    {
                        current.Append("\"\"");
                        i++; // skip next quote
                        continue;
                    }

                    current.Append('"');
                    result.Add((current.ToString(), true));
                    current.Clear();
                    inString = false;
                }
                else
                {
                    if (current.Length > 0)
                    {
                        result.Add((current.ToString(), false));
                        current.Clear();
                    }
                    current.Append('"');
                    inString = true;
                }
            }
            else
            {
                current.Append(c);
            }
        }

        if (current.Length > 0)
        {
            result.Add((current.ToString(), inString));
        }

        return result;
    }
}
