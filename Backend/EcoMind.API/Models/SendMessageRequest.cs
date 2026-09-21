namespace EcoMind.API.Models
{
    public class SendMessageRequest
    {
        private string _pickupRequestId = string.Empty;
        private string _text = string.Empty;

        public string PickupRequestId
        {
            get => !string.IsNullOrEmpty(_pickupRequestId) ? _pickupRequestId : (RequestId ?? string.Empty);
            set => _pickupRequestId = value;
        }

        public string Text
        {
            get => !string.IsNullOrEmpty(_text) ? _text : (Message ?? string.Empty);
            set => _text = value;
        }

        public string? RequestId { get; set; }
        public string? SenderId { get; set; }
        public string? SenderRole { get; set; }
        public string? Message { get; set; }
    }

    public class MarkReadRequest
    {
        public string RequestId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }
}