namespace EcoMind.API.DTOs
{
    public class UpdateWorkerDutyDto
    {
        public string Email { get; set; } = string.Empty;
        public string WorkerId { get; set; } = string.Empty;
        public bool IsOnDuty { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
