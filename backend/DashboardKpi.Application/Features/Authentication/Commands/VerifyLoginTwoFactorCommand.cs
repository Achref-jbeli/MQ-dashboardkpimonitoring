namespace DashboardKpi.Application.Features.Authentication.Commands;

public record VerifyLoginTwoFactorCommand(int EmployeeId, string Code);
