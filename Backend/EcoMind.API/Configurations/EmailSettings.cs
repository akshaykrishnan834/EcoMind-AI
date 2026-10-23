namespace EcoMind.API.Configurations
{
    public class EmailSettings
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public string Host { get; set; } = "smtp.gmail.com";

        public int Port { get; set; } = 465;

        // HTTP API Key (e.g. Brevo xkeysib- or Resend re_) to bypass Render free tier SMTP blocks
        public string ApiKey { get; set; } = string.Empty;
    }
}
