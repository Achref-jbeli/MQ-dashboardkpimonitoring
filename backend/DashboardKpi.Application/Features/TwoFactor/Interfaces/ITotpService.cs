namespace DashboardKpi.Application.Features.TwoFactor.Interfaces;

public interface ITotpService
{
    string GenerateSecret();

    string GenerateQrCode(
        string email,
        string secret
    );

    bool ValidateCode(
        string secret,
        string code
    );
}