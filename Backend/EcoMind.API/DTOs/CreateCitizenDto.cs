namespace EcoMind.API.DTOs
{
    public class CreateCitizenDto
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string WardId { get; set; } = string.Empty;

        public string PanchayatName { get; set; } = string.Empty;
    }
}