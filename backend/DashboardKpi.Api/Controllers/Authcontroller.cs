using DashboardKpi.Application.Features.Authentication.Commands;
using DashboardKpi.Application.Features.Authentication.Handlers;
using Microsoft.AspNetCore.Mvc;

namespace DashboardKpi.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly LoginCommandHandler _handler;
    private readonly RegisterAccountRequestHandler _registerHandler;
    private readonly VerifyLoginTwoFactorCommandHandler _verifyTwoFactorHandler;
    private readonly ForgotPasswordCommandHandler _forgotPasswordHandler;
    private readonly VerifyResetCodeCommandHandler _verifyResetCodeHandler;
    private readonly ResetPasswordCommandHandler _resetPasswordHandler;

    public AuthController(
        LoginCommandHandler handler,
        RegisterAccountRequestHandler registerHandler,
        VerifyLoginTwoFactorCommandHandler verifyTwoFactorHandler,
        ForgotPasswordCommandHandler forgotPasswordHandler,
        VerifyResetCodeCommandHandler verifyResetCodeHandler,
        ResetPasswordCommandHandler resetPasswordHandler)
    {
        _handler = handler;
        _registerHandler = registerHandler;
        _verifyTwoFactorHandler = verifyTwoFactorHandler;
        _forgotPasswordHandler = forgotPasswordHandler;
        _verifyResetCodeHandler = verifyResetCodeHandler;
        _resetPasswordHandler = resetPasswordHandler;
    }

    [HttpPost("register-request")]
    public async Task<IActionResult> RegisterRequest([FromBody] RegisterAccountRequestCommand command)
    {
        try
        {
            var result = await _registerHandler.Handle(command);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        try
        {
            var result = await _handler.Handle(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(new { message = exception.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new
        {
            message = "Logged out successfully."
        });
    }

    [HttpPost("verify-2fa")]
    public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyLoginTwoFactorCommand command)
    {
        try
        {
            var result = await _verifyTwoFactorHandler.Handle(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(new { message = exception.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestCommand command)
    {
        try
        {
            var result = await _forgotPasswordHandler.Handle(command);
            return Ok(result);
        }
        catch (KeyNotFoundException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("verify-reset-code")]
    public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeCommand command)
    {
        try
        {
            var result = await _verifyResetCodeHandler.Handle(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command)
    {
        try
        {
            var result = await _resetPasswordHandler.Handle(command);
            return Ok(result);
        }
        catch (KeyNotFoundException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}