using EcoMind.API.Helpers;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    [BsonIgnoreExtraElements]
    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string NotificationId { get; set; } = string.Empty;

        // Citizen ID, Worker ID, or Email
        public string UserId { get; set; } = string.Empty;

        public string UserRole { get; set; } = "Citizen"; // "Citizen", "Worker", "Admin"

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        // "pickup_due", "admin_approved", "admin_rejected", "pickup_scheduled", "pickup_completed"
        public string Type { get; set; } = "info";

        public string? RequestId { get; set; }

        public bool IsRead { get; set; } = false;

        [BsonSerializer(typeof(FlexibleDateTimeSerializer))]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
