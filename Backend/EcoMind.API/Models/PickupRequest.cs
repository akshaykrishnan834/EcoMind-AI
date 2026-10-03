using EcoMind.API.Helpers;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    [BsonIgnoreExtraElements]
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

        // Overall estimated plastic waste volume: "Small", "Medium", "Large"
        public string EstimatedVolume { get; set; } = "Medium";

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

        [BsonSerializer(typeof(FlexibleNullableDateTimeSerializer))]
        public DateTime? AcceptedAt { get; set; }

        // Scheduled collection date (Must be between 15th and 25th of month)
        [BsonSerializer(typeof(FlexibleNullableDateTimeSerializer))]
        public DateTime? CollectionDate { get; set; }

        // Scheduled Date (synced with CollectionDate)
        [BsonSerializer(typeof(FlexibleNullableDateTimeSerializer))]
        public DateTime? ScheduledDate { get; set; }

        // Due tracking: "Due", "Reason Submitted", or null
        public string? DueStatus { get; set; }

        // Reason provided when pickup was due / not completed
        public string? DueReason { get; set; }

        [BsonSerializer(typeof(FlexibleNullableDateTimeSerializer))]
        public DateTime? DueReasonSubmittedAt { get; set; }

        public string? DueReasonSubmittedBy { get; set; }

        // Citizen & Admin approval tracking for missed / passed pickup rescheduling
        public string? CitizenApprovalStatus { get; set; }

        [BsonSerializer(typeof(FlexibleNullableDateTimeSerializer))]
        public DateTime? CitizenApprovedAt { get; set; }

        public string? AdminApprovalStatus { get; set; }

        [BsonSerializer(typeof(FlexibleNullableDateTimeSerializer))]
        public DateTime? AdminApprovedAt { get; set; }

        // Request timestamp
        [BsonSerializer(typeof(FlexibleDateTimeSerializer))]
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        // Filled when waste is collected by worker
        [BsonSerializer(typeof(FlexibleNullableDateTimeSerializer))]
        public DateTime? CollectedAt { get; set; }

        // Assigned collection period (on or before 25th = current month; after 25th = next month)
        public int? CollectionMonth { get; set; }

        public int? CollectionYear { get; set; }

        public string? CollectionPeriodName { get; set; }

        // Unique 4-digit verification code shown only to citizen for pickup completion verification
        public string VerificationCode { get; set; } = string.Empty;
    }
}