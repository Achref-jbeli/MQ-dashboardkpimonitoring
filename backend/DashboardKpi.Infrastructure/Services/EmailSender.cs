using System.Net;
using System.Net.Mail;
using DashboardKpi.Application.Features.TwoFactor.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DashboardKpi.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string body)
    {
        var host = _configuration["Email:SmtpHost"];
        var from = _configuration["Email:From"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            _logger.LogInformation("SMTP not configured. Verification message for {Email}: {Body}", toEmail, body);
            return;
        }

        var port = int.TryParse(_configuration["Email:SmtpPort"], out var parsedPort) ? parsedPort : 587;
        var username = _configuration["Email:Username"];
        var password = _configuration["Email:Password"];
        var enableSsl = !string.Equals(_configuration["Email:EnableSsl"], "false", StringComparison.OrdinalIgnoreCase);

        using var client = new SmtpClient(host, port);
        client.EnableSsl = enableSsl;

        if (string.IsNullOrWhiteSpace(username))
        {
            client.UseDefaultCredentials = true;
        }
        else
        {
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(username, password);
        }

        using var message = new MailMessage(from, toEmail, subject, body);
        await client.SendMailAsync(message);
    }

}


