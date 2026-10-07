namespace EcoMind.API.DTOs
{
    public class CreateRazorpayOrderDto
    {
        public string CitizenId { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public bool ApplyEcoDiscount { get; set; } = false;
    }

    public class RazorpayOrderResponseDto
    {
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string KeyId { get; set; } = string.Empty;
        public int Amount { get; set; } = 5000; // in paise (₹50 = 5000, ₹40 = 4000)
        public string Currency { get; set; } = "INR";
        public int Month { get; set; }
        public int Year { get; set; }
        public double BaseAmount { get; set; } = 50.0;
        public double DiscountAmount { get; set; } = 0.0;
        public int PointsRedeemed { get; set; } = 0;
        public double NetAmount { get; set; } = 50.0;
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
        public bool ApplyEcoDiscount { get; set; } = false;
    }

    public class RedeemPointsDto
    {
        public string CitizenId { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public int PointsToRedeem { get; set; } = 10;
    }

    public class RedeemPointsResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int PointsRedeemed { get; set; }
        public int RemainingPoints { get; set; }
        public double BaseAmount { get; set; } = 50.0;
        public double DiscountAmount { get; set; } = 10.0;
        public double NetAmount { get; set; } = 40.0;
        public Models.Payment? Payment { get; set; }
    }
}
