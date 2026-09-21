using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IPickupRequestRepository _pickupRepository;

        public MessageService(
            IMessageRepository messageRepository,
            IPickupRequestRepository pickupRepository)
        {
            _messageRepository = messageRepository;
            _pickupRepository = pickupRepository;
        }

        public async Task<Message> SendMessageAsync(
            SendMessageRequest request,
            string senderId,
            string senderType)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
            {
                throw new Exception("Message cannot be empty.");
            }

            var cleanRequestId = (request.PickupRequestId ?? "").Trim();
            var pickup = await _pickupRepository.GetByRequestIdAsync(cleanRequestId);

            if (pickup == null)
            {
                throw new Exception("Pickup request not found.");
            }

            string citizenId = pickup.CitizenId ?? string.Empty;
            string workerId = pickup.AcceptedByWorkerId ?? string.Empty;

            var cleanSenderId = (senderId ?? "").Trim();
            var cleanSenderType = (senderType ?? "").Trim();

            // If pickup does not have an assigned worker yet and worker sends message, bind it
            if (string.IsNullOrEmpty(workerId) && string.Equals(cleanSenderType, "Worker", StringComparison.OrdinalIgnoreCase))
            {
                workerId = cleanSenderId;
            }

            var message = new Message
            {
                MessageId =
                    "MSG" +
                    Guid.NewGuid()
                        .ToString("N")
                        .Substring(0, 10)
                        .ToUpper(),

                PickupRequestId =
                    cleanRequestId,

                CitizenId =
                    citizenId,

                WorkerId =
                    workerId,

                SenderId =
                    cleanSenderId,

                SenderType =
                    cleanSenderType,

                Text =
                    request.Text.Trim(),

                IsRead = false,

                CreatedAt =
                    DateTime.UtcNow
            };

            return await _messageRepository
                .CreateMessageAsync(message);
        }

        public async Task<List<Message>> GetMessagesAsync(
            string pickupRequestId,
            string userId)
        {
            var cleanRequestId = (pickupRequestId ?? "").Trim();
            var messages =
                await _messageRepository
                    .GetMessagesByPickupRequestAsync(
                        cleanRequestId);

            return messages;
        }

        public async Task MarkAsReadAsync(
            string pickupRequestId,
            string userId)
        {
            await _messageRepository
                .MarkMessagesAsReadAsync(
                    pickupRequestId,
                    userId);
        }

        public async Task<long> GetUnreadCountAsync(
            string userId,
            string userType)
        {
            return await _messageRepository
                .GetUnreadCountAsync(
                    userId,
                    userType);
        }
    }
}