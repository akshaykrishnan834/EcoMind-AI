using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IMessageService
    {
        Task<MessageItem> SendMessageAsync(
            SendMessageRequest request,
            string senderId,
            string senderRole);

        Task<Conversation> GetOrCreateConversationAsync(
            string citizenId,
            string workerId);

        Task<Conversation?> GetConversationByIdAsync(
            string conversationId);

        Task<List<ConversationSummaryDto>> GetWorkerConversationsAsync(
            string workerId);

        Task<Conversation?> GetCitizenConversationAsync(
            string citizenId,
            string? workerId = null);

        Task MarkAsReadAsync(
            string conversationId,
            string userId,
            string userRole);

        Task<long> GetUnreadCountAsync(
            string userId,
            string userRole);

        Task<Conversation?> GetConversationByPickupRequestIdAsync(
            string pickupRequestId);
    }
}