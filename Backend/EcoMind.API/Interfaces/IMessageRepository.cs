using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IMessageRepository
    {
        Task<Conversation?> GetConversationAsync(string citizenId, string workerId);

        Task<Conversation?> GetConversationByIdAsync(string conversationId);

        Task<Conversation> CreateConversationAsync(Conversation conversation);

        Task UpdateConversationAsync(Conversation conversation);

        Task<List<Conversation>> GetConversationsByWorkerAsync(string workerId);

        Task<List<Conversation>> GetConversationsByCitizenAsync(string citizenId);

        Task AddMessageToConversationAsync(
            string conversationId,
            MessageItem messageItem,
            bool isSentByCitizen);

        Task MarkConversationReadAsync(
            string conversationId,
            string userRole);

        Task<long> GetUnreadCountAsync(
            string userId,
            string userRole);
    }
}