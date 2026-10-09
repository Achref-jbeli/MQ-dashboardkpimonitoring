namespace DashboardKpi.Application.Features.Authentication.DTOs;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int EmployeeId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? Department { get; set; }

    public int? DepartmentId { get; set; }

    public bool RequiresTwoFactor { get; set; }

    public bool RequiresTwoFactorSetup { get; set; }

    public string? TwoFactorSetupProvider { get; set; }

    public string? GoogleAuthenticatorSecret { get; set; }

    public string? GoogleOtpAuthUri { get; set; }

    public int? ChallengeId { get; set; }

    public string Message { get; set; } = string.Empty;
}