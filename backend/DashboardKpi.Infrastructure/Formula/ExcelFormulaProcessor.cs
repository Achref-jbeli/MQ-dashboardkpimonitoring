using System.Globalization;
using System.Text.RegularExpressions;
using DashboardKpi.Application.Interfaces;

namespace DashboardKpi.Infrastructure.Formula;

public class ExcelFormulaProcessor : IExcelFormulaProcessor
{
    private readonly IFormulaTranslator _translator;

    public ExcelFormulaProcessor(IFormulaTranslator translator)
    {
        _translator = translator;
    }

    public object? EvaluateFormula(
        string formula,
        IReadOnlyDictionary<string, object?> rowValues,
        int? currentRowIndex = null)
    {
        if (string.IsNullOrWhiteSpace(formula))
        {
            return null;
        }

        var translated = _translator.TranslateFrenchFormula(formula);
        if (string.IsNullOrWhiteSpace(translated))
        {
            return null;
        }

        try
        {
            var parser = new FormulaParser(translated, rowValues, currentRowIndex);
            return parser.ParseAndEvaluate();
        }
        catch
        {
            return null;
        }
    }

    private sealed class FormulaParser
    {
        private readonly string _input;
        private readonly IReadOnlyDictionary<string, object?> _rowValues;
        private readonly int? _currentRowIndex;
        private int _position;

        public FormulaParser(string input, IReadOnlyDictionary<string, object?> rowValues, int? currentRowIndex)
        {
            _input = input;
            _rowValues = rowValues;
            _currentRowIndex = currentRowIndex;
            _position = 0;
        }

        public object? ParseAndEvaluate()
        {
            SkipWhitespace();
            var result = ParseExpression();
            SkipWhitespace();
            return result;
        }

        private object? ParseExpression()
        {
            return ParseComparison();
        }

        private object? ParseComparison()
        {
            var left = ParseAdditive();

            SkipWhitespace();
            while (_position < _input.Length)
            {
                var op = PeekComparisonOperator();
                if (op == null)
                {
                    break;
                }

                _position += op.Length;
                var right = ParseAdditive();

                left = EvaluateComparison(left, op, right);
                SkipWhitespace();
            }

            return left;
        }

        private string? PeekComparisonOperator()
        {
            if (_position >= _input.Length)
            {
                return null;
            }

            if (_position + 1 < _input.Length)
            {
                var twoChar = _input.Substring(_position, 2);
                if (twoChar is "<=" or ">=" or "<>" or "!=" or "==")
                {
                    return twoChar;
                }
            }

            var singleChar = _input[_position];
            if (singleChar is '<' or '>' or '=')
            {
                return singleChar.ToString();
            }

            return null;
        }

        private static bool EvaluateComparison(object? left, string op, object? right)
        {
            if (op is "=" or "==")
            {
                return AreEqual(left, right);
            }
            if (op is "<>" or "!=")
            {
                return !AreEqual(left, right);
            }

            var leftNum = ToDecimal(left);
            var rightNum = ToDecimal(right);

            if (leftNum.HasValue && rightNum.HasValue)
            {
                return op switch
                {
                    "<" => leftNum.Value < rightNum.Value,
                    "<=" => leftNum.Value <= rightNum.Value,
                    ">" => leftNum.Value > rightNum.Value,
                    ">=" => leftNum.Value >= rightNum.Value,
                    _ => false,
                };
            }

            // String comparison fallback
            var leftStr = left?.ToString() ?? string.Empty;
            var rightStr = right?.ToString() ?? string.Empty;
            var comp = string.Compare(leftStr, rightStr, StringComparison.OrdinalIgnoreCase);

            return op switch
            {
                "<" => comp < 0,
                "<=" => comp <= 0,
                ">" => comp > 0,
                ">=" => comp >= 0,
                _ => false,
            };
        }

        private static bool AreEqual(object? left, object? right)
        {
            if (left == null && right == null) return true;
            if (left == null && right is string rs && string.IsNullOrEmpty(rs)) return true;
            if (right == null && left is string ls && string.IsNullOrEmpty(ls)) return true;

            var leftNum = ToDecimal(left);
            var rightNum = ToDecimal(right);
            if (leftNum.HasValue && rightNum.HasValue)
            {
                return leftNum.Value == rightNum.Value;
            }

            var leftStr = left?.ToString() ?? string.Empty;
            var rightStr = right?.ToString() ?? string.Empty;
            return string.Equals(leftStr, rightStr, StringComparison.OrdinalIgnoreCase);
        }

        private object? ParseAdditive()
        {
            var left = ParseMultiplicative();

            SkipWhitespace();
            while (_position < _input.Length)
            {
                var c = _input[_position];
                if (c != '+' && c != '-')
                {
                    break;
                }

                _position++;
                var right = ParseMultiplicative();

                var leftNum = ToDecimal(left) ?? 0m;
                var rightNum = ToDecimal(right) ?? 0m;

                left = c == '+' ? leftNum + rightNum : leftNum - rightNum;
                SkipWhitespace();
            }

            return left;
        }

        private object? ParseMultiplicative()
        {
            var left = ParseUnary();

            SkipWhitespace();
            while (_position < _input.Length)
            {
                var c = _input[_position];
                if (c != '*' && c != '/')
                {
                    break;
                }

                _position++;
                var right = ParseUnary();

                var leftNum = ToDecimal(left) ?? 0m;
                var rightNum = ToDecimal(right) ?? 1m;

                left = c == '*' ? leftNum * rightNum : (rightNum != 0m ? leftNum / rightNum : 0m);
                SkipWhitespace();
            }

            return left;
        }

        private object? ParseUnary()
        {
            SkipWhitespace();
            if (_position < _input.Length && _input[_position] == '-')
            {
                _position++;
                var val = ParsePrimary();
                var num = ToDecimal(val);
                return num.HasValue ? -num.Value : val;
            }

            if (_position < _input.Length && _input[_position] == '+')
            {
                _position++;
            }

            return ParsePrimary();
        }

        private object? ParsePrimary()
        {
            SkipWhitespace();
            if (_position >= _input.Length)
            {
                return null;
            }

            var c = _input[_position];

            // Parenthesized expression
            if (c == '(')
            {
                _position++;
                var result = ParseExpression();
                SkipWhitespace();
                if (_position < _input.Length && _input[_position] == ')')
                {
                    _position++;
                }
                return result;
            }

            // String literal
            if (c == '"')
            {
                return ParseStringLiteral();
            }

            // Number literal
            if (char.IsDigit(c) || (c == '.' && _position + 1 < _input.Length && char.IsDigit(_input[_position + 1])))
            {
                return ParseNumberLiteral();
            }

            // Identifier (function name or cell reference)
            if (char.IsLetter(c) || c == '_' || c == '$')
            {
                return ParseIdentifierOrFunction();
            }

            _position++;
            return null;
        }

        private string ParseStringLiteral()
        {
            _position++; // skip opening "
            var sb = new System.Text.StringBuilder();

            while (_position < _input.Length)
            {
                var c = _input[_position];
                if (c == '"')
                {
                    if (_position + 1 < _input.Length && _input[_position + 1] == '"')
                    {
                        sb.Append('"');
                        _position += 2;
                        continue;
                    }

                    _position++; // skip closing "
                    break;
                }

                sb.Append(c);
                _position++;
            }

            return sb.ToString();
        }

        private decimal ParseNumberLiteral()
        {
            var start = _position;
            var hasDot = false;

            while (_position < _input.Length)
            {
                var c = _input[_position];
                if (char.IsDigit(c))
                {
                    _position++;
                }
                else if (c == '.' && !hasDot)
                {
                    hasDot = true;
                    _position++;
                }
                else
                {
                    break;
                }
            }

            var numStr = _input[start.._position];
            return decimal.TryParse(numStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var num) ? num : 0m;
        }

        private object? ParseIdentifierOrFunction()
        {
            var start = _position;
            while (_position < _input.Length)
            {
                var c = _input[_position];
                if (char.IsLetterOrDigit(c) || c == '_' || c == '$' || c == '.')
                {
                    _position++;
                }
                else
                {
                    break;
                }
            }

            var ident = _input[start.._position].Replace("$", string.Empty);
            SkipWhitespace();

            // Function call
            if (_position < _input.Length && _input[_position] == '(')
            {
                _position++; // skip (
                return EvaluateFunction(ident);
            }

            // Literal boolean
            if (string.Equals(ident, "TRUE", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
            if (string.Equals(ident, "FALSE", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            // Cell or variable reference
            return ResolveCellReference(ident);
        }

        private object? EvaluateFunction(string functionName)
        {
            var upper = functionName.ToUpperInvariant();

            if (upper == "IF")
            {
                // Special handling for IF to support short-circuiting
                var conditionResult = ParseExpression();
                var condition = IsTruthy(conditionResult);

                SkipWhitespace();
                if (_position < _input.Length && _input[_position] == ',')
                {
                    _position++;
                }

                // If condition is true, evaluate true branch, then skip/evaluate false branch
                var trueBranch = ParseExpression();

                object? falseBranch = null;
                SkipWhitespace();
                if (_position < _input.Length && _input[_position] == ',')
                {
                    _position++;
                    falseBranch = ParseExpression();
                }

                SkipWhitespace();
                if (_position < _input.Length && _input[_position] == ')')
                {
                    _position++;
                }

                return condition ? trueBranch : falseBranch;
            }

            // General argument evaluation for other functions
            var args = new List<object?>();
            SkipWhitespace();
            if (_position < _input.Length && _input[_position] != ')')
            {
                while (_position < _input.Length)
                {
                    var arg = ParseExpression();
                    args.Add(arg);

                    SkipWhitespace();
                    if (_position < _input.Length && _input[_position] == ',')
                    {
                        _position++;
                        continue;
                    }
                    break;
                }
            }

            if (_position < _input.Length && _input[_position] == ')')
            {
                _position++;
            }

            return upper switch
            {
                "AND" => args.All(IsTruthy),
                "OR" => args.Any(IsTruthy),
                "MONTH" => EvaluateMonth(args),
                "NETWORKDAYS" => EvaluateNetworkDays(args),
                _ => args.FirstOrDefault(),
            };
        }

        private static object? EvaluateMonth(IReadOnlyList<object?> args)
        {
            if (args.Count == 0 || args[0] == null)
            {
                return string.Empty;
            }

            var date = TryParseDate(args[0]);
            if (date.HasValue)
            {
                return date.Value.Month;
            }

            return string.Empty;
        }

        private static object? EvaluateNetworkDays(IReadOnlyList<object?> args)
        {
            if (args.Count < 2 || args[0] == null || args[1] == null)
            {
                return string.Empty;
            }

            var start = TryParseDate(args[0]);
            var end = TryParseDate(args[1]);

            if (!start.HasValue || !end.HasValue)
            {
                return string.Empty;
            }

            var startDate = start.Value.Date;
            var endDate = end.Value.Date;

            if (startDate <= endDate)
            {
                var workingDays = 0;
                var current = startDate;
                while (current <= endDate)
                {
                    if (current.DayOfWeek != DayOfWeek.Saturday && current.DayOfWeek != DayOfWeek.Sunday)
                    {
                        workingDays++;
                    }
                    current = current.AddDays(1);
                }
                return workingDays;
            }
            else
            {
                var workingDays = 0;
                var current = endDate;
                while (current <= startDate)
                {
                    if (current.DayOfWeek != DayOfWeek.Saturday && current.DayOfWeek != DayOfWeek.Sunday)
                    {
                        workingDays++;
                    }
                    current = current.AddDays(1);
                }
                return -workingDays;
            }
        }

        private object? ResolveCellReference(string identifier)
        {
            // 1. Direct match in dictionary
            if (_rowValues.TryGetValue(identifier, out var directValue))
            {
                return directValue ?? string.Empty;
            }

            // 2. Column letter extraction: e.g. "Q3" -> column "Q", "AD3" -> "AD"
            var match = Regex.Match(identifier, @"^([A-Za-z]+)(\d+)?$");
            if (match.Success)
            {
                var colLetters = match.Groups[1].Value.ToUpperInvariant();

                // Check by column letter
                if (_rowValues.TryGetValue(colLetters, out var letterVal))
                {
                    return letterVal ?? string.Empty;
                }

                // Check by Column{Index} or ColumnLetter in Values
                var colIndex = ColumnLetterToIndex(colLetters);
                var colKey = $"Column{colIndex}";
                if (_rowValues.TryGetValue(colKey, out var indexVal))
                {
                    return indexVal ?? string.Empty;
                }
            }

            return string.Empty;
        }

        private static int ColumnLetterToIndex(string column)
        {
            var sum = 0;
            foreach (var c in column.ToUpperInvariant())
            {
                sum *= 26;
                sum += (c - 'A' + 1);
            }
            return sum;
        }

        private static bool IsTruthy(object? value)
        {
            if (value == null) return false;
            if (value is bool b) return b;
            if (value is int i) return i != 0;
            if (value is decimal d) return d != 0m;
            if (value is double db) return db != 0;
            if (value is string s)
            {
                if (string.IsNullOrWhiteSpace(s)) return false;
                if (bool.TryParse(s, out var sb)) return sb;
                if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var sd)) return sd != 0m;
                return true;
            }
            return true;
        }

        private static decimal? ToDecimal(object? value)
        {
            if (value == null) return null;
            if (value is decimal d) return d;
            if (value is int i) return i;
            if (value is double db) return (decimal)db;
            if (value is long l) return l;
            if (value is bool b) return b ? 1m : 0m;

            var str = value.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(str)) return null;

            if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out var inv))
            {
                return inv;
            }
            if (decimal.TryParse(str, NumberStyles.Any, CultureInfo.CurrentCulture, out var cur))
            {
                return cur;
            }

            return null;
        }

        private static DateTime? TryParseDate(object? value)
        {
            if (value == null) return null;
            if (value is DateTime dt) return dt;

            // Excel serial date number
            var num = ToDecimal(value);
            if (num.HasValue && num.Value > 1000 && num.Value < 100000)
            {
                try
                {
                    return DateTime.FromOADate((double)num.Value);
                }
                catch
                {
                }
            }

            var str = value.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(str)) return null;

            var formats = new[] { "yyyy-MM-dd", "dd.MM.yyyy", "d.M.yyyy", "dd/MM/yyyy", "M/d/yyyy", "yyyy/MM/dd", "dd-MM-yyyy" };
            if (DateTime.TryParseExact(str, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var exact))
            {
                return exact;
            }

            if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.None, out var inv))
            {
                return inv;
            }

            return null;
        }

        private void SkipWhitespace()
        {
            while (_position < _input.Length && char.IsWhiteSpace(_input[_position]))
            {
                _position++;
            }
        }
    }
}
