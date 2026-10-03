using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface INotificationRepository
    {
        Task CreateAsync(Notification notification);

        Task<List<Notification>> GetByUserIdAsync(string userId);

        Task<bool> MarkAsReadAsync(string notificationId);

        Task<bool> MarkAllAsReadAsync(string userId);

        Task<bool> HasNotificationAsync(string userId, string requestId, string type);
    }
}
