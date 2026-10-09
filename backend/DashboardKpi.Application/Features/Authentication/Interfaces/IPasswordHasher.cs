namespace DashboardKpi.Application.Features.Authentication.Interfaces;

public interface IPasswordHasher
{
    bool Verify(string password, string hash);

    string Hash(string password);
}