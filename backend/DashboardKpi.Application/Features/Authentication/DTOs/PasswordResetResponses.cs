namespace DashboardKpi.Application.Features.Authentication.DTOs;

public record ForgotPasswordResponse
{
    public bool RequiresTwoFactor { get; init; }
    public string Provider { get; init; } = "email";
    public int EmployeeId { get; init; }
    public string Message { get; init; } = string.Empty;
}

public record VerifyResetCodeResponse
{
    public bool Valid { get; init; }
    public int EmployeeId { get; init; }
    public string ResetToken { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}

public record ResetPasswordResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
}
