using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PickupRequestController : ControllerBase
    {
        private readonly IPickupRequestService _pickupService;

        public PickupRequestController(IPickupRequestService pickupService)
        {
            _pickupService = pickupService;
        }

        // 1. Citizen creates pickup request (Requirement 1)
        [HttpPost]
        public async Task<IActionResult> CreatePickupRequest([FromBody] CreatePickupRequestDto dto)
        {
            try
            {
                var request = await _pickupService.CreateAsync(dto);

                if (request == null)
                {
                    return NotFound(new { message = "Citizen profile not found. Please verify your login session." });
                }

                return Ok(new
                {
                    message = "Pickup request submitted successfully.",
                    requestId = request.RequestId,
                    status = request.Status,
                    collectionDate = request.CollectionDate
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Admin views all pickup requests across system
        [HttpGet("all")]
        public async Task<IActionResult> GetAllPickupRequests()
        {
            var requests = await _pickupService.GetAllRequestsAsync();
            return Ok(requests);
        }

        // 5. Citizen views own pickup requests (Requirement 5)
        [HttpGet("citizen/{citizenId}")]
        public async Task<IActionResult> GetCitizenRequests(string citizenId)
        {
            var requests = await _pickupService.GetCitizenRequestsAsync(citizenId);
            var response = requests.Select(r => new
            {
                r.RequestId,
                r.Status,
                r.WasteItems,
                r.RequestedAt,
                r.CollectionDate,
                r.AcceptedByWorkerId,
                r.AcceptedAt,
                r.CollectedAt,
                r.AIAnalyzed,
                r.AIConfidence,
                r.SegregationAdvice
            });
            return Ok(response);
        }

        // Monthly status check endpoint
        [HttpGet("citizen/{citizenId}/monthly-status")]
        public async Task<IActionResult> GetMonthlyStatus(string citizenId)
        {
            var request = await _pickupService.GetCurrentMonthRequestAsync(citizenId);
            return Ok(new
            {
                hasMonthlyRequest = request != null,
                request = request
            });
        }

        // 2. Worker views requests in their ward (Requirement 2)
        [HttpGet("ward/{wardId}")]
        public async Task<IActionResult> GetWardRequests(string wardId)
        {
            var requests = await _pickupService.GetWardRequestsAsync(wardId);
            return Ok(requests);
        }

        // 3. Worker schedules & accepts pickup request -> Status: "Scheduled" (Requirement 3)
        [HttpPut("{requestId}/schedule")]
        public async Task<IActionResult> SchedulePickup(
            string requestId,
            [FromBody] SchedulePickupRequestDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto?.WorkerId))
                {
                    return BadRequest(new { message = "Worker ID is required to schedule pickup." });
                }

                if (dto.CollectionDate == default)
                {
                    return BadRequest(new { message = "Valid CollectionDate is required." });
                }

                var updated = await _pickupService.ScheduleRequestAsync(requestId, dto.WorkerId, dto.CollectionDate);
                if (!updated)
                {
                    return NotFound(new { message = "Pickup request not found." });
                }

                return Ok(new
                {
                    message = $"Pickup request scheduled successfully for {dto.CollectionDate:yyyy-MM-dd}.",
                    status = "Scheduled",
                    collectionDate = dto.CollectionDate
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 4. Worker marks pickup request as collected -> Status: "Completed" (Requirement 4)
        [HttpPut("{requestId}/complete")]
        public async Task<IActionResult> CompletePickup(
            string requestId,
            [FromBody] CompletePickupRequestDto? dto = null)
        {
            try
            {
                var updated = await _pickupService.CompleteRequestAsync(requestId, dto?.WorkerId);
                if (!updated)
                {
                    return NotFound(new { message = "Pickup request not found." });
                }

                return Ok(new
                {
                    message = "Pickup request marked as completed.",
                    status = "Completed"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Legacy / Generic status update endpoint
        [HttpPut("{requestId}/status")]
        public async Task<IActionResult> UpdateStatus(
            string requestId,
            [FromBody] UpdatePickupStatusDto dto)
        {
            try
            {
                var updated = await _pickupService.UpdateStatusAsync(requestId, dto.Status);

                if (!updated)
                {
                    return NotFound(new { message = "Pickup request not found." });
                }

                return Ok(new { message = "Pickup request status updated successfully." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class UpdatePickupStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}