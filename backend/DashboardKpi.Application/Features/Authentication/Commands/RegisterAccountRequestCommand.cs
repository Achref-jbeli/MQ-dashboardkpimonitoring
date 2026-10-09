namespace DashboardKpi.Application.Features.Authentication.Commands;

public class RegisterAccountRequestCommand
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string? TwoFactorProvider { get; set; } = string.Empty;
    public string? GoogleAuthenticatorSecret { get; set; }
}
