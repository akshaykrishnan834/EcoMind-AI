namespace EcoMind.API.DTOs
{
    public class CreateWorkerDto
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string WardId { get; set; } = string.Empty;
    }
}