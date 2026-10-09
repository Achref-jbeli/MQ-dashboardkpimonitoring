using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using DashboardKpi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using DashboardKpi.Infrastructure.Data;

public class TwoFactorRepository 
: ITwoFactorRepository
{

private readonly ApplicationDbContext _context;


public TwoFactorRepository(
ApplicationDbContext context)
{
_context=context;
}



public async Task<TwoFactorConfigurations?>
GetConfigurationAsync(int employeeId)
{

return await _context
.TwoFactorConfigurations
.FirstOrDefaultAsync(
x=>x.EmployeeId==employeeId
);

}



public async Task SaveConfigurationAsync(
TwoFactorConfigurations config)
{

await _context
.TwoFactorConfigurations
.AddAsync(config);

await _context.SaveChangesAsync();

}



public async Task CreateChallengeAsync(
TwoFactorChallenge challenge)
{

await _context.TwoFactorChallenges
.AddAsync(challenge);

await _context.SaveChangesAsync();

}




public async Task<TwoFactorChallenge?> GetActiveChallengeAsync(int employeeId)
{
    return await _context
        .TwoFactorChallenges
        .Where(x => x.EmployeeId == employeeId && !x.Used && x.Expiration > DateTime.UtcNow)
        .OrderByDescending(x => x.Id)
        .FirstOrDefaultAsync();
}



public async Task UpdateAsync(
TwoFactorConfigurations config)
{

_context.Update(config);

await _context.SaveChangesAsync();

}

}