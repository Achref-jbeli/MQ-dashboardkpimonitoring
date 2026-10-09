namespace DashboardKpi.Application.Features.Authentication.Commands;

public record ForgotPasswordRequestCommand(string Email);

public record VerifyResetCodeCommand(int EmployeeId, string Code);

public record ResetPasswordCommand(int EmployeeId, string ResetToken, string NewPassword);
