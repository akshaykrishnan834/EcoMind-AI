using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/messages")]
    [Route("api/[controller]")]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessageController(
            IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage(
            [FromBody] SendMessageRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new
                {
                    message = "Message is required."
                });
            }

            var senderId =
                Request.Headers["X-User-Id"].FirstOrDefault()
                ?? request.SenderId;

            var senderType =
                Request.Headers["X-User-Type"].FirstOrDefault()
                ?? request.SenderRole;

            if (string.IsNullOrWhiteSpace(senderId) ||
                string.IsNullOrWhiteSpace(senderType))
            {
                return Unauthorized(new
                {
                    message = "User information is missing."
                });
            }

            try
            {
                var message =
                    await _messageService.SendMessageAsync(
                        request,
                        senderId,
                        senderType);

                return Ok(message);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("{pickupRequestId}")]
        [HttpGet("pickup/{pickupRequestId}")]
        public async Task<IActionResult> GetMessages(
            string pickupRequestId,
            [FromQuery] string? userId = null)
        {
            var headerUserId = Request.Headers["X-User-Id"].FirstOrDefault();
            var effectiveUserId = !string.IsNullOrWhiteSpace(headerUserId)
                ? headerUserId
                : !string.IsNullOrWhiteSpace(userId)
                    ? userId
                    : "user";

            try
            {
                var messages =
                    await _messageService
                        .GetMessagesAsync(
                            pickupRequestId,
                            effectiveUserId);

                return Ok(messages);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPut("read/{pickupRequestId}")]
        [HttpPut("read")]
        public async Task<IActionResult> MarkAsRead(
            string? pickupRequestId,
            [FromBody] MarkReadRequest? body = null)
        {
            var reqId = !string.IsNullOrEmpty(pickupRequestId)
                ? pickupRequestId
                : body?.RequestId ?? string.Empty;

            var userId =
                Request.Headers["X-User-Id"].FirstOrDefault()
                ?? body?.UserId;

            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(reqId))
            {
                return Unauthorized();
            }

            await _messageService.MarkAsReadAsync(
                reqId,
                userId);

            return Ok(new
            {
                message = "Messages marked as read."
            });
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId =
                Request.Headers["X-User-Id"].FirstOrDefault();

            var userType =
                Request.Headers["X-User-Type"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(userId) ||
                string.IsNullOrWhiteSpace(userType))
            {
                return Unauthorized();
            }

            var count =
                await _messageService
                    .GetUnreadCountAsync(
                        userId,
                        userType);

            return Ok(new
            {
                unreadCount = count
            });
        }
    }
}