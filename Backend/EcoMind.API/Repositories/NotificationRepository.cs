using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly IMongoCollection<Notification> _notifications;

        public NotificationRepository(MongoDbService mongoDbService)
        {
            _notifications = mongoDbService.Database
                .GetCollection<Notification>("Notifications");
        }

        public async Task CreateAsync(Notification notification)
        {
            if (string.IsNullOrWhiteSpace(notification.NotificationId))
            {
                notification.NotificationId = "NOTIF_" + Guid.NewGuid().ToString("N")[..10].ToUpper();
            }
            await _notifications.InsertOneAsync(notification);
        }

        public async Task<List<Notification>> GetByUserIdAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return new List<Notification>();

            var clean = userId.Trim();
            return await _notifications
                .Find(x => x.UserId == clean)
                .SortByDescending(x => x.CreatedAt)
                .Limit(50)
                .ToListAsync();
        }

        public async Task<bool> MarkAsReadAsync(string notificationId)
        {
            if (string.IsNullOrWhiteSpace(notificationId)) return false;

            var clean = notificationId.Trim();
            var result = await _notifications.UpdateOneAsync(
                x => x.Id == clean || x.NotificationId == clean,
                Builders<Notification>.Update.Set(x => x.IsRead, true)
            );

            return result.ModifiedCount > 0;
        }

        public async Task<bool> MarkAllAsReadAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return false;

            var clean = userId.Trim();
            var result = await _notifications.UpdateManyAsync(
                x => x.UserId == clean && !x.IsRead,
                Builders<Notification>.Update.Set(x => x.IsRead, true)
            );

            return result.ModifiedCount > 0;
        }

        public async Task<bool> HasNotificationAsync(string userId, string requestId, string type)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(requestId)) return false;

            return await _notifications
                .Find(x => x.UserId == userId.Trim() && x.RequestId == requestId.Trim() && x.Type == type)
                .AnyAsync();
        }
    }
}
