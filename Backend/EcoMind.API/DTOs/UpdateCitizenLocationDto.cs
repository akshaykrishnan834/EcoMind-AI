namespace EcoMind.API.DTOs
{
    public class UpdateCitizenLocationDto
    {
        public string Address { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }
    }
}