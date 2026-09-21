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

        public MessageController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        // 1. Send Message in Citizen <-> Worker conversation
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new { message = "Message text is required." });
            }

            var senderId = Request.Headers["X-User-Id"].FirstOrDefault() ?? request.SenderId;
            var senderRole = Request.Headers["X-User-Type"].FirstOrDefault() ?? request.SenderRole;

            if (string.IsNullOrWhiteSpace(senderId) || string.IsNullOrWhiteSpace(senderRole))
            {
                return Unauthorized(new { message = "User information (X-User-Id / X-User-Type) is missing." });
            }

            try
            {
                var message = await _messageService.SendMessageAsync(
                    request,
                    senderId,
                    senderRole);

                return Ok(message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2. Get active conversation between Citizen and Worker
        [HttpGet("conversation")]
        public async Task<IActionResult> GetConversation(
            [FromQuery] string citizenId,
            [FromQuery] string workerId)
        {
            if (string.IsNullOrWhiteSpace(citizenId) || string.IsNullOrWhiteSpace(workerId))
            {
                return BadRequest(new { message = "Both citizenId and workerId are required." });
            }

            try
            {
                var conv = await _messageService.GetOrCreateConversationAsync(citizenId, workerId);
                return Ok(conv);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 3. Get conversation by ConversationId
        [HttpGet("conversation/{conversationId}")]
        public async Task<IActionResult> GetConversationById(string conversationId)
        {
            var conv = await _messageService.GetConversationByIdAsync(conversationId);
            if (conv == null)
            {
                return NotFound(new { message = "Conversation not found." });
            }
            return Ok(conv);
        }

        // 4. Worker views list of all assigned citizens / conversations (with latest message and unread count)
        [HttpGet("worker/{workerId}")]
        [HttpGet("worker/{workerId}/conversations")]
        public async Task<IActionResult> GetWorkerConversations(string workerId)
        {
            if (string.IsNullOrWhiteSpace(workerId))
            {
                return BadRequest(new { message = "Worker ID is required." });
            }

            var list = await _messageService.GetWorkerConversationsAsync(workerId);
            return Ok(list);
        }

        // 5. Citizen views their conversation with assigned worker
        [HttpGet("citizen/{citizenId}")]
        [HttpGet("citizen/{citizenId}/conversation")]
        public async Task<IActionResult> GetCitizenConversation(
            string citizenId,
            [FromQuery] string? workerId = null)
        {
            if (string.IsNullOrWhiteSpace(citizenId))
            {
                return BadRequest(new { message = "Citizen ID is required." });
            }

            var conv = await _messageService.GetCitizenConversationAsync(citizenId, workerId);
            if (conv == null)
            {
                return NotFound(new { message = "No conversation found or assigned worker unavailable." });
            }

            return Ok(conv);
        }

        // 6. Mark conversation as read
        [HttpPut("conversation/{conversationId}/read")]
        [HttpPut("read")]
        public async Task<IActionResult> MarkAsRead(
            string? conversationId,
            [FromBody] MarkReadRequest? body = null)
        {
            var convId = !string.IsNullOrEmpty(conversationId)
                ? conversationId
                : body?.ConversationId;

            var userId = Request.Headers["X-User-Id"].FirstOrDefault() ?? body?.UserId ?? "user";
            var userRole = Request.Headers["X-User-Type"].FirstOrDefault() ?? body?.UserRole ?? "Citizen";

            // If conversationId not directly provided, find by citizenId & workerId
            if (string.IsNullOrEmpty(convId) && !string.IsNullOrEmpty(body?.CitizenId) && !string.IsNullOrEmpty(body?.WorkerId))
            {
                var conv = await _messageService.GetOrCreateConversationAsync(body.CitizenId, body.WorkerId);
                convId = conv.ConversationId;
            }
            // If requestId provided, resolve conversation
            else if (string.IsNullOrEmpty(convId) && !string.IsNullOrEmpty(body?.RequestId))
            {
                var conv = await _messageService.GetConversationByPickupRequestIdAsync(body.RequestId);
                convId = conv?.ConversationId;
            }

            if (string.IsNullOrEmpty(convId))
            {
                return BadRequest(new { message = "Conversation identifier is required." });
            }

            await _messageService.MarkAsReadAsync(convId, userId, userRole);
            return Ok(new { message = "Conversation marked as read." });
        }

        // 7. Get total unread count for badge
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = Request.Headers["X-User-Id"].FirstOrDefault();
            var userRole = Request.Headers["X-User-Type"].FirstOrDefault() ?? "Citizen";

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var count = await _messageService.GetUnreadCountAsync(userId, userRole);
            return Ok(new { unreadCount = count });
        }

        // 8. Backward Compatibility: /api/Message/{requestId}
        // Instead of creating a separate chat, it resolves the Citizen & Worker from the pickup request and returns their unified conversation!
        [HttpGet("{pickupRequestId}")]
        [HttpGet("pickup/{pickupRequestId}")]
        public async Task<IActionResult> GetMessagesByPickupRequest(string pickupRequestId)
        {
            try
            {
                var conv = await _messageService.GetConversationByPickupRequestIdAsync(pickupRequestId);
                if (conv == null)
                {
                    return Ok(new List<MessageItem>());
                }

                return Ok(conv);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}