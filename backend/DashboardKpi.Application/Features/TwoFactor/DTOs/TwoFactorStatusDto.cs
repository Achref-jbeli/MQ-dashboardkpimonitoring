namespace DashboardKpi.Application.Features.TwoFactor.DTOs;

public class TwoFactorStatusDto
{
    public bool IsEnabled { get; set; }
    public string Provider { get; set; } = string.Empty;
}
