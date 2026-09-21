using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    public class Conversation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfDefault]
        public string? Id { get; set; }

        public string ConversationId { get; set; } = string.Empty;

        public string CitizenId { get; set; } = string.Empty;

        public string WorkerId { get; set; } = string.Empty;

        public string CitizenName { get; set; } = string.Empty;

        public string CitizenEmail { get; set; } = string.Empty;

        public string CitizenPhone { get; set; } = string.Empty;

        public string HouseNumber { get; set; } = string.Empty;

        public string HouseName { get; set; } = string.Empty;

        public string WardId { get; set; } = string.Empty;

        public string WorkerName { get; set; } = string.Empty;

        public string WorkerEmail { get; set; } = string.Empty;

        public string WorkerPhone { get; set; } = string.Empty;

        public string LastMessageText { get; set; } = string.Empty;

        public DateTime? LastMessageAt { get; set; }

        public string LastSenderId { get; set; } = string.Empty;

        public string LastSenderRole { get; set; } = string.Empty;

        public int UnreadCountCitizen { get; set; } = 0;

        public int UnreadCountWorker { get; set; } = 0;

        public List<MessageItem> Messages { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class MessageItem
    {
        public string MessageId { get; set; } = string.Empty;

        public string SenderId { get; set; } = string.Empty;

        public string SenderType { get; set; } = string.Empty; // "Citizen" | "Worker"

        public string Text { get; set; } = string.Empty;

        public string? PickupRequestId { get; set; } // Optional reference context

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
