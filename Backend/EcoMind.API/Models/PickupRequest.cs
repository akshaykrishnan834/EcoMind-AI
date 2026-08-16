using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    public class PickupRequest
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        // Public pickup request ID
        public string RequestId { get; set; } = string.Empty;

        // Reference to the citizen
        public string CitizenId { get; set; } = string.Empty;

        // Used to show the request to the correct worker/ward
        public string WardId { get; set; } = string.Empty;

        // Plastic waste details
        public List<WasteItem> WasteItems { get; set; } = new();

        // Overall waste classification (Defaults to Recyclable Plastic)
        public string OverallCategory { get; set; } = "Recyclable Plastic";

        // AI information
        public bool AIAnalyzed { get; set; } = false;

        public double AIConfidence { get; set; } = 0;

        public string SegregationAdvice { get; set; } = string.Empty;

        // Pickup status: "Pending", "Scheduled", "Completed", "Cancelled"
        public string Status { get; set; } = "Pending";

        // Worker acceptance details
        public string? AcceptedByWorkerId { get; set; }

        public DateTime? AcceptedAt { get; set; }

        // Scheduled collection date (Must be between 15th and 25th of month)
        public DateTime? CollectionDate { get; set; }

        // Request timestamp
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        // Filled when waste is collected by worker
        public DateTime? CollectedAt { get; set; }
    }

    public class WasteItem
    {
        public string Type { get; set; } = string.Empty;

        public int Quantity { get; set; }
    }
}