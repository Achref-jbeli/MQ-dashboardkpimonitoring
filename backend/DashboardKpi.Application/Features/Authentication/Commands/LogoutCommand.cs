namespace DashboardKpi.Application.Features.Authentication.Commands;

public class LogoutCommand
{
    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
}