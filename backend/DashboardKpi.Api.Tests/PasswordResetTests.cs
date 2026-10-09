using System.Net.Http.Json;
using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.DTOs;
using DashboardKpi.Application.Features.Authentication.Interfaces;
using DashboardKpi.Domain.Entities;
using DashboardKpi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DashboardKpi.Api.Tests;

public class PasswordResetTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public PasswordResetTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ForgotPassword_Email2FA_And_ResetPassword_Flow_WorksEndToEnd()
    {
        var client = _factory.CreateClient();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

            var existing = await db.Employees.FirstOrDefaultAsync(e => e.Email == "reset_user@marquardt.com");
            if (existing == null)
            {
                db.Employees.Add(new Employee
                {
                    FirstName = "Reset",
                    LastName = "User",
                    Email = "reset_user@marquardt.com",
                    PasswordHash = hasher.Hash("OldPassword123!"),
                    Role = "Employee",
                    IsActive = true,
                    IsAccountApproved = true,
                    TwoFactorEnabled = true,
                    TwoFactorProvider = "email",
                });
                await db.SaveChangesAsync();
            }
        }

        // 1. Request Password Reset
        var forgotRes = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequestCommand("reset_user@marquardt.com"));
        Assert.True(forgotRes.IsSuccessStatusCode);
        var forgotData = await forgotRes.Content.ReadFromJsonAsync<ForgotPasswordResponse>();
        Assert.NotNull(forgotData);
        Assert.True(forgotData.RequiresTwoFactor);
        Assert.True(forgotData.EmployeeId > 0);

        // Retrieve challenge code created in DB
        string challengeCode;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var challenge = await db.TwoFactorChallenges
                .Where(c => c.EmployeeId == forgotData.EmployeeId && !c.Used)
                .OrderByDescending(c => c.Id)
                .FirstOrDefaultAsync();

            Assert.NotNull(challenge);
            challengeCode = challenge.Code;
        }

        // 2. Verify 2FA Reset Code
        var verifyRes = await client.PostAsJsonAsync("/api/auth/verify-reset-code", new VerifyResetCodeCommand(forgotData.EmployeeId, challengeCode));
        Assert.True(verifyRes.IsSuccessStatusCode);
        var verifyData = await verifyRes.Content.ReadFromJsonAsync<VerifyResetCodeResponse>();
        Assert.NotNull(verifyData);
        Assert.True(verifyData.Valid);
        Assert.False(string.IsNullOrWhiteSpace(verifyData.ResetToken));

        // 3. Reset Password with New Password
        var resetRes = await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordCommand(forgotData.EmployeeId, verifyData.ResetToken, "BrandNewPassword456!"));
        Assert.True(resetRes.IsSuccessStatusCode);
        var resetData = await resetRes.Content.ReadFromJsonAsync<ResetPasswordResponse>();
        Assert.NotNull(resetData);
        Assert.True(resetData.Success);

        // 4. Verify that Employee now has the updated password hash
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
            var emp = await db.Employees.FirstOrDefaultAsync(e => e.Id == forgotData.EmployeeId);
            Assert.NotNull(emp);
            Assert.NotNull(emp.PasswordHash);
            Assert.True(hasher.Verify("BrandNewPassword456!", emp.PasswordHash!));
            Assert.False(hasher.Verify("OldPassword123!", emp.PasswordHash!));
        }
    }
}
