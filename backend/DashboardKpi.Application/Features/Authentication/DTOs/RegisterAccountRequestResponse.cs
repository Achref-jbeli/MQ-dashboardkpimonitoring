namespace DashboardKpi.Application.Features.Authentication.DTOs;

public class RegisterAccountRequestResponse
{
    public int RequestId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? GoogleAuthenticatorSecret { get; set; }
    public string? GoogleOtpAuthUri { get; set; }
}
