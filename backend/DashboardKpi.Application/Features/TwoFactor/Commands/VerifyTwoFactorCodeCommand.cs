namespace DashboardKpi.Application.Features.TwoFactor.Commands;

public record VerifyTwoFactorCodeCommand(int EmployeeId, string Code);
