using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Interfaces;

public interface IKpiDataExtractor
{
    string SourceType { get; }

    Task<IReadOnlyList<RawKpiRecord>> ExtractAsync(Stream stream, string? contextInfo = null, CancellationToken cancellationToken = default);
}
