namespace EcoMind.API.DTOs
{
    public class CreatePanchayatDto
    {
        public string PanchayatName { get; set; } = string.Empty;

        public string District { get; set; } = string.Empty;

        public int NumberOfWards { get; set; }
    }
}