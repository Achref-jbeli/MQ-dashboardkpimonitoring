using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Extraction;

public class CsvKpiExtractor : IKpiDataExtractor
{
    public string SourceType => "Csv";

    public async Task<IReadOnlyList<RawKpiRecord>> ExtractAsync(
        Stream stream,
        string? contextInfo = null,
        CancellationToken cancellationToken = default)
    {
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        using var reader = new StreamReader(stream, leaveOpen: true);
        var content = await reader.ReadToEndAsync(cancellationToken);

        var lines = content
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.None)
            .Where(line => line != null)
            .ToList();

        if (lines.Count == 0)
        {
            return [];
        }

        // Determine delimiter from first non-empty line
        var firstLine = lines.FirstOrDefault(l => !string.IsNullOrWhiteSpace(l)) ?? string.Empty;
        var delimiter = DetectDelimiter(firstLine);

        var parsedLines = lines
            .Select(line => SplitCsvLine(line, delimiter))
            .ToList();

        // Header detection: scan for known token or first non-empty row
        var headerIndex = parsedLines.FindIndex(cells => cells.Any(cell => IsKnownHeaderToken(cell)));
        if (headerIndex < 0)
        {
            headerIndex = parsedLines.FindIndex(cells => cells.Any(cell => !string.IsNullOrWhiteSpace(cell)));
        }

        if (headerIndex < 0)
        {
            return [];
        }

        var headerCells = parsedLines[headerIndex];
        var headers = new List<HeaderColumn>();
        var seenHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < headerCells.Length; i++)
        {
            var headerText = headerCells[i].Trim();
            var colLetter = IndexToColumnLetter(i + 1);

            if (string.IsNullOrWhiteSpace(headerText))
            {
                headerText = $"Column{i + 1}";
            }
            else if (seenHeaders.Contains(headerText))
            {
                headerText = $"{headerText}_{i + 1}";
            }

            seenHeaders.Add(headerText);
            headers.Add(new HeaderColumn(i, colLetter, headerText));
        }

        var records = new List<RawKpiRecord>();
        var rowIndex = headerIndex + 1;

        foreach (var columns in parsedLines.Skip(headerIndex + 1))
        {
            rowIndex++;
            var record = new RawKpiRecord
            {
                SourceType = SourceType,
                SourceIdentifier = contextInfo,
                RowIndex = rowIndex
            };

            var hasData = false;

            foreach (var header in headers)
            {
                var value = header.ColumnIndex < columns.Length ? columns[header.ColumnIndex].Trim() : string.Empty;
                if (!string.IsNullOrWhiteSpace(value))
                {
                    hasData = true;
                }

                record.Values[header.HeaderName] = value;
                record.Values[header.ColumnLetter] = value;
                record.Values[$"Column{header.ColumnIndex + 1}"] = value;
            }

            if (hasData)
            {
                records.Add(record);
            }
        }

        return records;
    }

    private static string DetectDelimiter(string line)
    {
        var commaCount = line.Count(c => c == ',');
        var semicolonCount = line.Count(c => c == ';');
        var tabCount = line.Count(c => c == '\t');

        if (semicolonCount > commaCount && semicolonCount > tabCount) return ";";
        if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
        return ",";
    }

    private static string[] SplitCsvLine(string line, string delimiter)
    {
        var result = new List<string>();
        var inQuotes = false;
        var current = new System.Text.StringBuilder();

        var sep = delimiter[0];

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                    continue;
                }

                inQuotes = !inQuotes;
            }
            else if (c == sep && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }

        result.Add(current.ToString());
        return result.ToArray();
    }

    private static bool IsKnownHeaderToken(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        var norm = text.Trim();
        return string.Equals(norm, "Change No.", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Status", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Issue Status", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Tasks", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Bus. unit", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Designation", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Désignation", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "N° FicheM.", StringComparison.OrdinalIgnoreCase)
            || string.Equals(norm, "Responsible", StringComparison.OrdinalIgnoreCase);
    }

    private static string IndexToColumnLetter(int columnNumber)
    {
        var dividend = columnNumber;
        var columnName = string.Empty;

        while (dividend > 0)
        {
            var modulo = (dividend - 1) % 26;
            columnName = Convert.ToChar('A' + modulo) + columnName;
            dividend = (dividend - modulo) / 26;
        }

        return columnName;
    }

    private sealed record HeaderColumn(int ColumnIndex, string ColumnLetter, string HeaderName);
}
