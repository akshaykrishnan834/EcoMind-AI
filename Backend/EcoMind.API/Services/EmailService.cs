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

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string bodyHtml)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                throw new ArgumentException("Recipient email address is required.");
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

            // Accept SSL certificates safely in development
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            // Connect using STARTTLS for Gmail on port 587
            await client.ConnectAsync(
                string.IsNullOrWhiteSpace(_emailSettings.Host) ? "smtp.gmail.com" : _emailSettings.Host.Trim(),
                _emailSettings.Port == 0 ? 587 : _emailSettings.Port,
                SecureSocketOptions.StartTls);

            // Authenticate with Gmail Email & App Password (automatically strip any spaces from App Passwords)
            string appPassword = (_emailSettings.Password ?? "").Trim().Replace(" ", "");
            await client.AuthenticateAsync(_emailSettings.Email.Trim(), appPassword);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
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
