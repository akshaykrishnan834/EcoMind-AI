using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    public class Message
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string MessageId { get; set; } = string.Empty;

        public string PickupRequestId { get; set; } = string.Empty;

        public string CitizenId { get; set; } = string.Empty;

        public string WorkerId { get; set; } = string.Empty;

        public string SenderId { get; set; } = string.Empty;

        public string SenderType { get; set; } = string.Empty;

        public string Text { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}