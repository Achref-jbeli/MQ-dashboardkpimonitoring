namespace DashboardKpi.Application.Interfaces;

public class AccountCreationRequestDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string RequestedRole { get; set; } = string.Empty;
    public string? TwoFactorProvider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public int? ReviewedByAdminId { get; set; }
    public string? RejectionReason { get; set; }
}
