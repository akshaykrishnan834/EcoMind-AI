using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IMessageRepository
    {
        Task<Message> CreateMessageAsync(Message message);

        Task<List<Message>> GetMessagesByPickupRequestAsync(
            string pickupRequestId);

        Task MarkMessagesAsReadAsync(
            string pickupRequestId,
            string userId);

        Task<long> GetUnreadCountAsync(
            string userId,
            string userType);
    }
}