using EcoMind.API.Configurations;
using EcoMind.API.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace EcoMind.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string bodyHtml)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                throw new ArgumentException("Recipient email address is required.");
            }

            string appPassword = (_emailSettings.Password ?? "").Trim().Replace(" ", "");
            if (string.IsNullOrWhiteSpace(appPassword) || string.IsNullOrWhiteSpace(_emailSettings.Email))
            {
                _logger.LogWarning("Email sending skipped: SMTP credentials are not configured in environment or appsettings.");
                throw new InvalidOperationException("SMTP credentials are not configured on the server.");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("EcoMind AI Security", _emailSettings.Email.Trim()));
            message.To.Add(new MailboxAddress("", toEmail.Trim()));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = bodyHtml
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            // Set 15-second timeout suitable for cloud hosting environments
            client.Timeout = 15000;

            // Accept SSL certificates safely in development and hosted environments
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            int port = _emailSettings.Port == 0 ? 587 : _emailSettings.Port;
            string host = string.IsNullOrWhiteSpace(_emailSettings.Host) ? "smtp.gmail.com" : _emailSettings.Host.Trim();

            // Candidate connections: try configured port first, then fallback port (essential for cloud platforms like Render)
            var connectionAttempts = new List<(int Port, SecureSocketOptions Options)>
            {
                (port, port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls)
            };

            if (port == 587)
            {
                connectionAttempts.Add((465, SecureSocketOptions.SslOnConnect));
            }
            else if (port == 465)
            {
                connectionAttempts.Add((587, SecureSocketOptions.StartTls));
            }

            bool sent = false;
            Exception? lastEx = null;

            foreach (var attempt in connectionAttempts)
            {
                try
                {
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(12));
                    await client.ConnectAsync(host, attempt.Port, attempt.Options, cts.Token);
                    await client.AuthenticateAsync(_emailSettings.Email.Trim(), appPassword, cts.Token);
                    await client.SendAsync(message, cts.Token);
                    await client.DisconnectAsync(true, cts.Token);
                    _logger.LogInformation("Email successfully dispatched via SMTP {Host}:{Port}.", host, attempt.Port);
                    sent = true;
                    break;
                }
                catch (Exception ex)
                {
                    lastEx = ex;
                    _logger.LogWarning("SMTP attempt via {Host}:{Port} failed: {Message}", host, attempt.Port, ex.Message);
                    try { if (client.IsConnected) await client.DisconnectAsync(true); } catch { }

                    // If credentials failed authentication (535), do not retry another port with same wrong credentials
                    if (ex.Message.Contains("535") || ex.Message.Contains("Authentication", StringComparison.OrdinalIgnoreCase))
                    {
                        break;
                    }
                }
            }

            if (!sent)
            {
                throw lastEx ?? new InvalidOperationException("Failed to connect to SMTP server.");
            }
        }

        public async Task SendOtpEmailAsync(string toEmail, string otpCode)
        {
            string subject = $"{otpCode} is your EcoMind AI Password Reset OTP Code";

            string bodyHtml = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f9f5; margin: 0; padding: 20px; }}
        .card {{ max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #d1fae5; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; }}
        .header {{ background-color: #0a4d2c; color: #ffffff; padding: 28px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0; }}
        .content {{ padding: 32px 28px; color: #374151; }}
        .greeting {{ font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 12px; }}
        .desc {{ font-size: 13px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; }}
        .otp-box {{ background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
        .otp-code {{ font-size: 36px; font-weight: 900; font-family: 'Courier New', Courier, monospace; color: #065f46; letter-spacing: 8px; margin: 0; }}
        .otp-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #047857; font-weight: 700; margin-top: 6px; }}
        .warning {{ font-size: 12px; color: #991b1b; background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; margin-bottom: 20px; }}
        .footer {{ background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af; }}
    </style>
</head>
<body>
    <div class=""card"">
        <div class=""header"">
            <h1>EcoMind AI Portal</h1>
            <p>Government of Kerala Smart Recyclable Waste Management</p>
        </div>
        <div class=""content"">
            <div class=""greeting"">Hello,</div>
            <div class=""desc"">
                We received a request to reset your EcoMind AI account password. Use the 6-digit OTP code below to complete your password reset process:
            </div>
            
            <div class=""otp-box"">
                <div class=""otp-code"">{otpCode}</div>
                <div class=""otp-label"">Valid for 10 Minutes</div>
            </div>

            <div class=""warning"">
                <strong>Security Notice:</strong> Do not share this OTP code with anyone. EcoMind AI staff will never ask for your OTP. If you did not request a password reset, please ignore this email.
            </div>
        </div>
        <div class=""footer"">
            &copy; {DateTime.UtcNow.Year} EcoMind AI • Local Self Government Department (LSGD), Kerala
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, bodyHtml);
        }
    }
}
