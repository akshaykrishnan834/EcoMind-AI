using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Services;
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
                    collectionDate = request.CollectionDate,
                    collectionMonth = request.CollectionMonth,
                    collectionYear = request.CollectionYear,
                    collectionPeriodName = request.CollectionPeriodName,
                    verificationCode = request.VerificationCode
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
            var response = requests.Select(r =>
            {
                var (targetYear, targetMonth, periodName) = PickupRequestService.GetRequestCollectionPeriod(r);
                return new
                {
                    Id = r.Id,
                    r.RequestId,
                    r.Status,
                    r.EstimatedVolume,
                    r.OverallCategory,
                    r.RequestedAt,
                    r.CollectionDate,
                    ScheduledDate = r.ScheduledDate ?? r.CollectionDate,
                    CollectionMonth = r.CollectionMonth ?? targetMonth,
                    CollectionYear = r.CollectionYear ?? targetYear,
                    CollectionPeriodName = r.CollectionPeriodName ?? periodName,
                    r.DueStatus,
                    r.DueReason,
                    r.DueReasonSubmittedAt,
                    r.DueReasonSubmittedBy,
                    r.CitizenApprovalStatus,
                    r.CitizenApprovedAt,
                    r.AdminApprovalStatus,
                    r.AdminApprovedAt,
                    r.AcceptedByWorkerId,
                    r.AcceptedAt,
                    r.CollectedAt,
                    r.VerificationCode
                };
            });
            return Ok(response);
        }

        // Monthly status check endpoint
        [HttpGet("citizen/{citizenId}/monthly-status")]
        public async Task<IActionResult> GetMonthlyStatus(string citizenId)
        {
            var request = await _pickupService.GetCurrentMonthRequestAsync(citizenId);
            var (targetYear, targetMonth, targetPeriodName) = PickupRequestService.CalculateAssignedCollectionPeriod(DateTime.UtcNow);
            return Ok(new
            {
                hasMonthlyRequest = request != null,
                request = request,
                targetCollectionMonth = targetMonth,
                targetCollectionYear = targetYear,
                targetPeriodName = targetPeriodName
            });
        }

        // 2. Worker views requests in their ward (Requirement 2) - supports filtering by workerId
        [HttpGet("ward/{wardId}")]
        public async Task<IActionResult> GetWardRequests(string wardId, [FromQuery] string? workerId = null)
        {
            var requests = await _pickupService.GetWardRequestsAsync(wardId, workerId);
            return Ok(requests);
        }

        // Worker views their assigned requests + pending in their ward
        [HttpGet("worker/{workerId}")]
        public async Task<IActionResult> GetWorkerRequests(string workerId)
        {
            var requests = await _pickupService.GetWorkerRequestsAsync(workerId);
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

                var targetDate = dto.ScheduledDate ?? dto.CollectionDate;
                if (!targetDate.HasValue || targetDate.Value == default)
                {
                    return BadRequest(new { message = "Valid ScheduledDate or CollectionDate is required." });
                }

                var updated = await _pickupService.ScheduleRequestAsync(requestId, dto.WorkerId, targetDate.Value);
                if (!updated)
                {
                    return NotFound(new { message = "Pickup request not found." });
                }

                return Ok(new
                {
                    message = $"Pickup request scheduled successfully for {targetDate.Value:yyyy-MM-dd}.",
                    status = "Scheduled",
                    collectionDate = targetDate.Value,
                    scheduledDate = targetDate.Value
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

        // 3b. Citizen or Worker submits reason for Due pickup request
        [HttpPut("{requestId}/due-reason")]
        public async Task<IActionResult> SubmitDueReason(
            string requestId,
            [FromBody] SubmitDueReasonDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto?.Reason))
                {
                    return BadRequest(new { message = "Due reason is required." });
                }

                var updated = await _pickupService.SubmitDueReasonAsync(requestId, dto.Reason, dto.SubmittedBy);
                if (!updated)
                {
                    return NotFound(new { message = "Pickup request not found or not in Due state." });
                }

                return Ok(new
                {
                    message = "Reason submitted successfully.",
                    dueStatus = "Reason Submitted",
                    dueReason = dto.Reason.Trim()
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

        // 3c. Admin reviews (approves or rejects) missed pickup reason
        [HttpPut("{requestId}/approve-reason")]
        public async Task<IActionResult> ApproveDueReason(
            string requestId,
            [FromBody] ApproveDueReasonDto dto)
        {
            try
            {
                var approver = string.IsNullOrWhiteSpace(dto?.ApprovedBy) ? "Admin" : dto.ApprovedBy.Trim();
                var action = string.IsNullOrWhiteSpace(dto?.Action) ? "Approve" : dto.Action.Trim();
                var updated = await _pickupService.ApproveDueReasonAsync(requestId, approver, action);
                if (!updated)
                {
                    return NotFound(new { message = "Pickup request not found or not eligible for approval." });
                }

                return Ok(new
                {
                    message = $"Admin {action.ToLower()}d missed pickup reason successfully."
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
                var updated = await _pickupService.CompleteRequestAsync(
                    requestId,
                    dto?.WorkerId,
                    dto?.VerificationCode ?? string.Empty);
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