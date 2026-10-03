using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly ICitizenRepository _citizenRepository;
        private readonly IEmailService _emailService;

        public NotificationService(
            INotificationRepository notificationRepository,
            ICitizenRepository citizenRepository,
            IEmailService emailService)
        {
            _notificationRepository = notificationRepository;
            _citizenRepository = citizenRepository;
            _emailService = emailService;
        }

        public async Task NotifyUserAsync(
            string userId,
            string userRole,
            string title,
            string message,
            string type,
            string? requestId = null)
        {
            if (string.IsNullOrWhiteSpace(userId)) return;

            var cleanUserId = userId.Trim();

            // Avoid spamming duplicate identical notification for the same request
            if (!string.IsNullOrWhiteSpace(requestId) &&
                await _notificationRepository.HasNotificationAsync(cleanUserId, requestId, type))
            {
                return;
            }

            var notification = new Notification
            {
                NotificationId = "NOTIF_" + Guid.NewGuid().ToString("N")[..10].ToUpper(),
                UserId = cleanUserId,
                UserRole = string.IsNullOrWhiteSpace(userRole) ? "Citizen" : userRole.Trim(),
                Title = title,
                Message = message,
                Type = type,
                RequestId = requestId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);

            // Optional email notification to citizen if email is available
            _ = Task.Run(async () =>
            {
                try
                {
                    string? targetEmail = null;
                    if (cleanUserId.Contains("@"))
                    {
                        targetEmail = cleanUserId;
                    }
                    else
                    {
                        var citizen = await _citizenRepository.GetCitizenByCitizenIdAsync(cleanUserId);
                        targetEmail = citizen?.Email;
                    }

                    if (!string.IsNullOrWhiteSpace(targetEmail))
                    {
                        string emailHtml = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #d1fae5; border-radius: 12px;'>
                            <div style='background-color: #0a4d2c; color: white; padding: 16px; border-radius: 8px; text-align: center;'>
                                <h2 style='margin: 0;'>EcoMind AI Notification</h2>
                                <p style='margin: 4px 0 0 0; font-size: 13px; color: #a7f3d0;'>Haritha Karma Sena Waste Management</p>
                            </div>
                            <div style='padding: 20px 10px; color: #374151;'>
                                <h3 style='color: #0a4d2c; margin-top: 0;'>{title}</h3>
                                <p style='font-size: 14px; line-height: 1.5;'>{message}</p>
                                {(string.IsNullOrWhiteSpace(requestId) ? "" : $"<p style='font-size: 12px; color: #6b7280;'>Request ID: <strong>{requestId}</strong></p>")}
                            </div>
                            <div style='border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 11px; color: #9ca3af; text-align: center;'>
                                Local Self Government Department (LSGD), Kerala
                            </div>
                        </div>";

                        await _emailService.SendEmailAsync(targetEmail, $"EcoMind AI: {title}", emailHtml);
                    }
                }
                catch
                {
                    // Fail safely without disrupting the workflow
                }
            });
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(string userId)
        {
            return await _notificationRepository.GetByUserIdAsync(userId);
        }

        public async Task<bool> MarkAsReadAsync(string notificationId)
        {
            return await _notificationRepository.MarkAsReadAsync(notificationId);
        }

        public async Task<bool> MarkAllAsReadAsync(string userId)
        {
            return await _notificationRepository.MarkAllAsReadAsync(userId);
        }
    }
}
