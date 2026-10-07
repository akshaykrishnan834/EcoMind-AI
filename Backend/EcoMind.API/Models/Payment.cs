using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    [BsonIgnoreExtraElements]
    public class Payment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string PaymentId { get; set; } = string.Empty;

        public string CitizenId { get; set; } = string.Empty;

        public int Month { get; set; }

        public int Year { get; set; }

        public double BaseAmount { get; set; } = 50.0;

        public double DiscountAmount { get; set; } = 0.0;

        public int PointsRedeemed { get; set; } = 0;

        public double Amount { get; set; } = 50.0;

        public string Status { get; set; } = "Unpaid"; // "Unpaid", "Paid"

        public string? PaymentMethod { get; set; } // "Online", "Pay Through Worker"

        public DateTime? PaidAt { get; set; }

        public string? TransactionId { get; set; }

        public string? RazorpayOrderId { get; set; }

        public string? RazorpayPaymentId { get; set; }

        public string? RazorpaySignature { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
