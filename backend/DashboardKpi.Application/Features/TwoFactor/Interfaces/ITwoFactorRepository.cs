using DashboardKpi.Domain.Entities;

namespace DashboardKpi.Application.Features.TwoFactor.Interfaces;


public interface ITwoFactorRepository
{

Task<TwoFactorConfigurations?> 
GetConfigurationAsync(int employeeId);


Task SaveConfigurationAsync(
TwoFactorConfigurations configuration
);



Task CreateChallengeAsync(
TwoFactorChallenge challenge
);



Task<TwoFactorChallenge?> 
GetActiveChallengeAsync(
int employeeId
);



Task UpdateAsync(
TwoFactorConfigurations configuration
);

}