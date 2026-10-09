namespace DashboardKpi.Application.Dtos.Import;

public class KpiImportErrorDto
{
    public int? Row { get; set; }

    public string? Column { get; set; }

    public string? Value { get; set; }

    public string Message { get; set; } = string.Empty;
}
