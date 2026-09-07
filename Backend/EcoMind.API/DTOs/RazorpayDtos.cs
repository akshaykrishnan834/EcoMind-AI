namespace EcoMind.API.DTOs
{
    public class CreateRazorpayOrderDto
    {
        public string CitizenId { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
    }

    public class RazorpayOrderResponseDto
    {
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string KeyId { get; set; } = string.Empty;
        public int Amount { get; set; } = 5000; // in paise (₹50 = 5000)
        public string Currency { get; set; } = "INR";
        public int Month { get; set; }
        public int Year { get; set; }
    }

    public class VerifyRazorpayPaymentDto
    {
        public string CitizenId { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }

    public class ProcessWorkerPaymentDto
    {
        public string CitizenId { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
    }
}
