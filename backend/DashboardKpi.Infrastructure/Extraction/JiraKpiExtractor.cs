using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Extraction;

public class JiraKpiExtractor : IJiraKpiExtractor
{
    private readonly HttpClient _httpClient;

    public JiraKpiExtractor(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IReadOnlyList<RawKpiRecord>> ExtractAsync(
        DataExtractionApi extractionApi,
        string? jql,
        string? apiKey = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(extractionApi.BaseUrl))
        {
            throw new InvalidOperationException("Jira extraction API must have a BaseUrl configured.");
        }

        var baseUrl = extractionApi.BaseUrl.TrimEnd('/');
        var token = !string.IsNullOrWhiteSpace(apiKey) ? apiKey : extractionApi.ApiKey;

        var records = new List<RawKpiRecord>();
        var startAt = 0;
        const int maxResults = 100;
        var total = int.MaxValue;

        while (startAt < total)
        {
            var path = extractionApi.EndpointPath;
            if (string.IsNullOrWhiteSpace(path))
            {
                var queryJql = string.IsNullOrWhiteSpace(jql) ? string.Empty : $"&jql={Uri.EscapeDataString(jql)}";
                path = $"/rest/api/3/search?startAt={startAt}&maxResults={maxResults}{queryJql}";
            }
            else
            {
                var separator = path.Contains('?') ? "&" : "?";
                path = $"{path}{separator}startAt={startAt}&maxResults={maxResults}";
                if (!string.IsNullOrWhiteSpace(jql) && !path.Contains("jql="))
                {
                    path += $"&jql={Uri.EscapeDataString(jql)}";
                }
            }

            var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}{path}");
            if (!string.IsNullOrWhiteSpace(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            if (root.TryGetProperty("total", out var totalEl) && totalEl.ValueKind == JsonValueKind.Number)
            {
                total = totalEl.GetInt32();
            }
            else
            {
                total = 0; // stop pagination if total not provided
            }

            if (!root.TryGetProperty("issues", out var issues) || issues.ValueKind != JsonValueKind.Array)
            {
                break;
            }

            var issueCount = 0;
            foreach (var issue in issues.EnumerateArray())
            {
                issueCount++;
                var key = issue.TryGetProperty("key", out var keyEl) ? keyEl.GetString() : null;
                var fields = issue.TryGetProperty("fields", out var fieldsEl) ? fieldsEl : default;

                var record = new RawKpiRecord
                {
                    SourceType = "Jira",
                    SourceIdentifier = key
                };

                if (key != null)
                {
                    record.Values["key"] = key;
                    record.Values["identifier"] = key;
                }

                if (fields.ValueKind == JsonValueKind.Object)
                {
                    PopulateFields(record, fields);
                }

                records.Add(record);
            }

            if (issueCount == 0 || issueCount < maxResults)
            {
                break;
            }

            startAt += issueCount;
        }

        return records;
    }

    private static void PopulateFields(RawKpiRecord record, JsonElement fields)
    {
        // Standard fields
        if (fields.TryGetProperty("summary", out var summaryEl) && summaryEl.ValueKind == JsonValueKind.String)
        {
            record.Values["summary"] = summaryEl.GetString();
        }

        // Status
        if (fields.TryGetProperty("status", out var statusEl) && statusEl.ValueKind == JsonValueKind.Object)
        {
            if (statusEl.TryGetProperty("name", out var statusNameEl) && statusNameEl.ValueKind == JsonValueKind.String)
            {
                var status = statusNameEl.GetString() ?? string.Empty;
                record.Values["status"] = status;
                record.Values["status.name"] = status;
            }
        }

        // Progress
        if (fields.TryGetProperty("progress", out var progressEl) && progressEl.ValueKind == JsonValueKind.Object)
        {
            if (progressEl.TryGetProperty("percent", out var percentEl) && percentEl.ValueKind == JsonValueKind.Number)
            {
                record.Values["progress"] = percentEl.GetDecimal();
            }
        }

        // Dates
        if (fields.TryGetProperty("duedate", out var dueEl) && dueEl.ValueKind == JsonValueKind.String)
        {
            record.Values["duedate"] = dueEl.GetString();
        }

        if (fields.TryGetProperty("resolutiondate", out var resEl) && resEl.ValueKind == JsonValueKind.String)
        {
            record.Values["resolutiondate"] = resEl.GetString();
        }

        if (fields.TryGetProperty("created", out var createdEl) && createdEl.ValueKind == JsonValueKind.String)
        {
            record.Values["created"] = createdEl.GetString();
        }

        if (fields.TryGetProperty("updated", out var updatedEl) && updatedEl.ValueKind == JsonValueKind.String)
        {
            record.Values["updated"] = updatedEl.GetString();
        }

        // Dynamic custom fields and nested objects
        foreach (var prop in fields.EnumerateObject())
        {
            if (record.Values.ContainsKey(prop.Name))
            {
                continue;
            }

            if (prop.Value.ValueKind == JsonValueKind.String)
            {
                record.Values[prop.Name] = prop.Value.GetString();
            }
            else if (prop.Value.ValueKind == JsonValueKind.Number)
            {
                record.Values[prop.Name] = prop.Value.GetDecimal();
            }
            else if (prop.Value.ValueKind == JsonValueKind.True || prop.Value.ValueKind == JsonValueKind.False)
            {
                record.Values[prop.Name] = prop.Value.GetBoolean();
            }
            else if (prop.Value.ValueKind == JsonValueKind.Object)
            {
                if (prop.Value.TryGetProperty("name", out var nameEl) && nameEl.ValueKind == JsonValueKind.String)
                {
                    record.Values[$"{prop.Name}.name"] = nameEl.GetString();
                    record.Values[prop.Name] = nameEl.GetString();
                }
                else if (prop.Value.TryGetProperty("value", out var valEl) && valEl.ValueKind == JsonValueKind.String)
                {
                    record.Values[$"{prop.Name}.value"] = valEl.GetString();
                    record.Values[prop.Name] = valEl.GetString();
                }
            }
        }
    }
}
