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

            // 1. If an HTTP API Key (Brevo or Resend) is configured, send via HTTPS (Port 443).
            // This is required on cloud hosting like Render Free Tier which blocks all outbound SMTP ports (25, 465, 587).
            if (!string.IsNullOrWhiteSpace(_emailSettings.ApiKey))
            {
                await SendEmailViaHttpApiAsync(toEmail, subject, bodyHtml);
                return;
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

            int configuredPort = _emailSettings.Port == 0 ? 465 : _emailSettings.Port;
            string host = string.IsNullOrWhiteSpace(_emailSettings.Host) ? "smtp.gmail.com" : _emailSettings.Host.Trim();

            // Prioritize Port 465 (SSL) first, as cloud hosts like Render block Port 587
            var connectionAttempts = new List<(int Port, SecureSocketOptions Options)>();
            if (configuredPort == 465)
            {
                connectionAttempts.Add((465, SecureSocketOptions.SslOnConnect));
                connectionAttempts.Add((587, SecureSocketOptions.StartTls));
            }
            else
            {
                connectionAttempts.Add((465, SecureSocketOptions.SslOnConnect));
                connectionAttempts.Add((configuredPort, SecureSocketOptions.StartTls));
            }

            bool sent = false;
            Exception? lastEx = null;

            foreach (var attempt in connectionAttempts)
            {
                using var client = new SmtpClient();
                client.Timeout = 15000;
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;

                try
                {
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
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

                    // If credentials failed authentication (535), do not retry another port with same wrong credentials
                    if (ex.Message.Contains("535") || ex.Message.Contains("Authentication", StringComparison.OrdinalIgnoreCase))
                    {
                        break;
                    }
                }
            }

            if (!sent)
            {
                if (lastEx is OperationCanceledException)
                {
                    throw new InvalidOperationException("Render Free Tier blocks outbound SMTP traffic (ports 25, 465, 587). Please configure EmailSettings__ApiKey (Brevo) in Render environment variables.");
                }

                throw lastEx ?? new InvalidOperationException("Failed to connect to SMTP server.");
            }
        }

        private async Task SendEmailViaHttpApiAsync(string toEmail, string subject, string bodyHtml)
        {
            var apiKey = _emailSettings.ApiKey.Trim();
            var senderEmail = string.IsNullOrWhiteSpace(_emailSettings.Email) ? "unknownperson37575@gmail.com" : _emailSettings.Email.Trim();

            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(15);

            if (apiKey.StartsWith("re_", StringComparison.OrdinalIgnoreCase))
            {
                // Resend HTTP API (https://api.resend.com/emails)
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                var payload = new
                {
                    from = $"EcoMind AI <{senderEmail}>",
                    to = new[] { toEmail.Trim() },
                    subject = subject,
                    html = bodyHtml
                };

                var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync("https://api.resend.com/emails", content);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    throw new InvalidOperationException($"Resend API error ({response.StatusCode}): {err}");
                }
                _logger.LogInformation("Email successfully dispatched via Resend HTTP API.");
            }
            else
            {
                // Brevo (Sendinblue) HTTP API (https://api.brevo.com/v3/smtp/email)
                httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
                httpClient.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

                var payload = new
                {
                    sender = new { name = "EcoMind AI", email = senderEmail },
                    to = new[] { new { email = toEmail.Trim() } },
                    subject = subject,
                    htmlContent = bodyHtml
                };

                var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    throw new InvalidOperationException($"Brevo API error ({response.StatusCode}): {err}");
                }
                _logger.LogInformation("Email successfully dispatched via Brevo HTTP API.");
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
