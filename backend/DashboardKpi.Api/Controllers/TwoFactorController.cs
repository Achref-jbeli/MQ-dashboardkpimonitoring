using DashboardKpi.Application.Features.TwoFactor.Commands;
using DashboardKpi.Application.Features.TwoFactor.DTOs;
using DashboardKpi.Application.Features.TwoFactor.Handlers;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/twofactor")]
public class TwoFactorController : ControllerBase
{
    private readonly EnableEmailTwoFactorHandler _enableEmailHandler;
    private readonly EnableGoogleTwoFactorHandler _enableGoogleHandler;
    private readonly VerifyTwoFactorCodeHandler _verifyHandler;
    private readonly DisableTwoFactorHandler _disableHandler;
    private readonly ITwoFactorRepository _twoFactorRepository;

    public TwoFactorController(
        EnableEmailTwoFactorHandler enableEmailHandler,
        EnableGoogleTwoFactorHandler enableGoogleHandler,
        VerifyTwoFactorCodeHandler verifyHandler,
        DisableTwoFactorHandler disableHandler,
        ITwoFactorRepository twoFactorRepository)
    {
        _enableEmailHandler = enableEmailHandler;
        _enableGoogleHandler = enableGoogleHandler;
        _verifyHandler = verifyHandler;
        _disableHandler = disableHandler;
        _twoFactorRepository = twoFactorRepository;
    }

    [HttpGet("status/{employeeId}")]
    public async Task<IActionResult> GetStatus(int employeeId)
    {
        var config = await _twoFactorRepository.GetConfigurationAsync(employeeId);
        return Ok(new TwoFactorStatusDto
        {
            IsEnabled = config?.Enabled ?? false,
            Provider = config?.Provider ?? ""
        });
    }

    [HttpPost("enable-email")]
    public async Task<IActionResult> EnableEmailTwoFactor([FromBody] EnableEmailTwoFactorCommand command)
    {
        try
        {
            await _enableEmailHandler.Handle(command);
            return Ok(new { message = "Email 2FA challenge initiated. Please check your email." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("enable-google")]
    public async Task<IActionResult> EnableGoogleTwoFactor([FromBody] EnableGoogleTwoFactorCommand command)
    {
        try
        {
            var result = await _enableGoogleHandler.Handle(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorCodeCommand command)
    {
        try
        {
            var result = await _verifyHandler.Handle(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("disable")]
    public async Task<IActionResult> DisableTwoFactor([FromBody] DisableTwoFactorCommand command)
    {
        try
        {
            var result = await _disableHandler.Handle(command);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
