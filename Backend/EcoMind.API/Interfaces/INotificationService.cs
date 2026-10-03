using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface INotificationService
    {
        Task NotifyUserAsync(
            string userId,
            string userRole,
            string title,
            string message,
            string type,
            string? requestId = null);

        Task<List<Notification>> GetUserNotificationsAsync(string userId);

        Task<bool> MarkAsReadAsync(string notificationId);

        Task<bool> MarkAllAsReadAsync(string userId);
    }
}
