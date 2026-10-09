using System.Globalization;
using DashboardKpi.Application.Dtos.Import;
using DashboardKpi.Application.Interfaces;
using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Infrastructure.Import;

public class JiraKpiImporter : IJiraKpiImporter
{
    private readonly IJiraKpiExtractor _jiraExtractor;

    public JiraKpiImporter(IJiraKpiExtractor jiraExtractor)
    {
        _jiraExtractor = jiraExtractor;
    }

    public async Task<(IReadOnlyList<NormalizedKpiRecord> Records, IReadOnlyList<KpiImportErrorDto> Errors)> ImportAsync(
        DataExtractionApi config,
        string? jql,
        string? apiKey,
        int departmentId,
        int projectId,
        CancellationToken cancellationToken = default)
    {
        var records = new List<NormalizedKpiRecord>();
        var errors = new List<KpiImportErrorDto>();

        try
        {
            var rawRecords = await _jiraExtractor.ExtractAsync(config, jql, apiKey, cancellationToken);

            var rowIndex = 0;
            foreach (var raw in rawRecords)
            {
                rowIndex++;
                var key = raw.Values.TryGetValue("key", out var k) ? k?.ToString() : raw.SourceIdentifier;
                var summary = raw.Values.TryGetValue("summary", out var s) ? s?.ToString() : null;
                var status = raw.Values.TryGetValue("status", out var st) ? st?.ToString() : "Open";
                var progress = raw.Values.TryGetValue("progress", out var pr) && pr is decimal p ? p : 0m;

                DateTime? dueDate = null;
                if (raw.Values.TryGetValue("duedate", out var dd) && dd != null && DateTime.TryParse(dd.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDue))
                {
                    dueDate = parsedDue;
                }

                DateTime? completedDate = null;
                if (raw.Values.TryGetValue("resolutiondate", out var rd) && rd != null && DateTime.TryParse(rd.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedRes))
                {
                    completedDate = parsedRes;
                }

                DateTime? createdDate = null;
                if (raw.Values.TryGetValue("created", out var cr) && cr != null && DateTime.TryParse(cr.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedCreated))
                {
                    createdDate = parsedCreated;
                }

                var isDone = string.Equals(status, "Done", StringComparison.OrdinalIgnoreCase)
                             || string.Equals(status, "Closed", StringComparison.OrdinalIgnoreCase)
                             || string.Equals(status, "Resolved", StringComparison.OrdinalIgnoreCase)
                             || completedDate.HasValue;

                var isGreen = false;
                var isYellow = false;
                var isOrange = false;
                var isRed = false;

                if (isDone)
                {
                    if (dueDate.HasValue && completedDate.HasValue && completedDate.Value <= dueDate.Value)
                    {
                        isGreen = true;
                    }
                    else
                    {
                        isYellow = true;
                    }
                }
                else
                {
                    if (dueDate.HasValue && dueDate.Value < DateTime.UtcNow)
                    {
                        var delay = (DateTime.UtcNow - dueDate.Value).TotalDays;
                        if (delay > 14) isRed = true;
                        else isOrange = true;
                    }
                    else
                    {
                        isYellow = true;
                    }
                }

                var record = new NormalizedKpiRecord
                {
                    DepartmentId = departmentId,
                    ProjectId = projectId,
                    Source = "Jira",
                    SourceRecordId = key,
                    ChangeNumber = key,
                    Title = summary ?? key ?? $"Issue {rowIndex}",
                    Status = isDone ? "Done" : "InProgress",
                    Progress = progress,
                    CreatedDate = createdDate,
                    SendDate = createdDate,
                    DueDate = dueDate,
                    CompletedDate = completedDate,
                    Month = (completedDate ?? dueDate ?? createdDate ?? DateTime.UtcNow).Month.ToString(),
                    IsGreen = isGreen,
                    IsYellow = isYellow,
                    IsOrange = isOrange,
                    IsRed = isRed,
                    AdditionalFields = raw.Values
                };

                records.Add(record);
            }
        }
        catch (Exception ex)
        {
            errors.Add(new KpiImportErrorDto
            {
                Message = $"Failed to extract Jira issues: {ex.Message}"
            });
        }

        return (records, errors);
    }
}
