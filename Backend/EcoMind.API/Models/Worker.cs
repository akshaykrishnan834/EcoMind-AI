using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    public class Worker
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string WorkerId { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string WardId { get; set; } = string.Empty;

        public string Status { get; set; } = "Active";

        public string CurrentWardId { get; set; } = string.Empty;

        public bool IsOnDuty { get; set; } = false;

        public double? CurrentLatitude { get; set; }

        public double? CurrentLongitude { get; set; }

        public DateTime? LastLocationUpdatedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}