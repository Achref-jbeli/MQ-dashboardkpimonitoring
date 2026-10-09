namespace DashboardKpi.Application.Features.TwoFactor.DTOs;

public class TwoFactorSetupResponse
{
    public string SecretKey { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string QrCodeUri { get; set; } = string.Empty;
}
