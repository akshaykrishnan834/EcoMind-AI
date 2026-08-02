namespace EcoMind.API.DTOs
{
    public class CreateWardDto
    {
        public string WardId { get; set; } = string.Empty;

        public string WardName { get; set; } = string.Empty;

        public string PanchayatName { get; set; } = string.Empty;

        public string Status { get; set; } = "Active";
    }
}