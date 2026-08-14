namespace EcoMind.API.DTOs
{
    public class UpdateCitizenDto
    {
        public string Email { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
        public string? HouseName { get; set; }
        public string? HouseNumber { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }
        public string WardId { get; set; } = string.Empty;

        public string PanchayatName { get; set; } = string.Empty;
    }
}
