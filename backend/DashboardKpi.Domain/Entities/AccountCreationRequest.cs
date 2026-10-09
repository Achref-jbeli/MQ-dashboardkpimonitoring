namespace DashboardKpi.Domain.Entities;

public class AccountCreationRequest
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public string Email { get; set; } = string.Empty;
    public string RequestedRole { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? TwoFactorProvider { get; set; } = string.Empty;
    public string? GoogleAuthenticatorSecret { get; set; }

    public string Status { get; set; } = "Pending";
    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAtUtc { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public string? RejectionReason { get; set; }
}
