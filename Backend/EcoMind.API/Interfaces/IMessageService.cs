using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IMessageService
    {
        Task<Message> SendMessageAsync(
            SendMessageRequest request,
            string senderId,
            string senderType);

        Task<List<Message>> GetMessagesAsync(
            string pickupRequestId,
            string userId);

        Task MarkAsReadAsync(
            string pickupRequestId,
            string userId);

        Task<long> GetUnreadCountAsync(
            string userId,
            string userType);
    }
}