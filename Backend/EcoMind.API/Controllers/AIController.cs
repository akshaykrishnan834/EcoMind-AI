using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;

        public AIController(IAIService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat(
            [FromBody] ChatRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new
                {
                    message = "Message is required."
                });
            }

            try
            {
                var response =
                    await _aiService.GetResponseAsync(
                        request.Message.Trim()
                    );

                return Ok(new
                {
                    response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unable to connect to EcoMind AI.",
                    error = ex.Message
                });
            }
        }
    }
}