namespace EcoMind.API.Models
{
    public class SendMessageRequest
    {
        public string CitizenId { get; set; } = string.Empty;
        public string WorkerId { get; set; } = string.Empty;

        public string? ConversationId { get; set; }

        // Optional context reference to a pickup request
        public string? PickupRequestId { get; set; }
        public string? RequestId { get; set; }

        public string? SenderId { get; set; }
        public string? SenderRole { get; set; } // "Citizen" | "Worker"

        private string _text = string.Empty;
        public string Text
        {
            get => !string.IsNullOrEmpty(_text) ? _text : (Message ?? string.Empty);
            set => _text = value;
        }

        public string? Message { get; set; }
    }

    public class MarkReadRequest
    {
        public string? ConversationId { get; set; }
        public string? CitizenId { get; set; }
        public string? WorkerId { get; set; }
        public string? RequestId { get; set; }
        public string? UserId { get; set; }
        public string? UserRole { get; set; }
    }

    public class ConversationSummaryDto
    {
        public string ConversationId { get; set; } = string.Empty;
        public string CitizenId { get; set; } = string.Empty;
        public string WorkerId { get; set; } = string.Empty;
        public string CitizenName { get; set; } = string.Empty;
        public string HouseNumber { get; set; } = string.Empty;
        public string HouseName { get; set; } = string.Empty;
        public string CitizenPhone { get; set; } = string.Empty;
        public string WardId { get; set; } = string.Empty;
        public string WorkerName { get; set; } = string.Empty;
        public string WorkerPhone { get; set; } = string.Empty;
        public string LastMessageText { get; set; } = string.Empty;
        public DateTime? LastMessageAt { get; set; }
        public string LastSenderRole { get; set; } = string.Empty;
        public int UnreadCount { get; set; } = 0;
        public string? ActivePickupRequestId { get; set; }
        public string? ActivePickupStatus { get; set; }
    }
}