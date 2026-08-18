namespace EcoMind.API.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string bodyHtml);

        Task SendOtpEmailAsync(string toEmail, string otpCode);
    }
}
