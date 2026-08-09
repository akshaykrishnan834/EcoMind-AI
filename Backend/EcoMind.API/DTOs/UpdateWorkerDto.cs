namespace EcoMind.API.DTOs
{
    public class UpdateWorkerDto
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string WardId { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
    }
}
