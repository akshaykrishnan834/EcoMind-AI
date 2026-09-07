namespace EcoMind.API.DTOs
{
    public class ProcessPaymentDto
    {
        public string CitizenId { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public string PaymentMethod { get; set; } = "Online"; // "Online" or "Pay Through Worker"
        public string? TransactionId { get; set; }
    }
}
