using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class PickupRequestService : IPickupRequestService
    {
        private readonly IPickupRequestRepository _pickupRepository;
        private readonly ICitizenRepository _citizenRepository;
        private readonly IWorkerRepository _workerRepository;
        private readonly INotificationService _notificationService;

        private static readonly HashSet<string> AllowedVolumes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Small",
            "Medium",
            "Large"
        };

        public PickupRequestService(
            IPickupRequestRepository pickupRepository,
            ICitizenRepository citizenRepository,
            IWorkerRepository workerRepository,
            INotificationService notificationService)
        {
            _pickupRepository = pickupRepository;
            _citizenRepository = citizenRepository;
            _workerRepository = workerRepository;
            _notificationService = notificationService;
        }

        public async Task<PickupRequest?> CreateAsync(CreatePickupRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                throw new ArgumentException("Citizen ID is required.");
            }

            // Get citizen from existing Citizens collection
            var citizen = await GetCitizenAsync(dto.CitizenId);
            if (citizen == null)
            {
                return null;
            }

            var requestTime = dto.RequestedAt ?? DateTime.UtcNow;
            var (targetYear, targetMonth, periodName) = CalculateAssignedCollectionPeriod(requestTime);

            // Check if citizen already has a pickup request for this assigned collection period
            var existingMonthlyRequest = await _pickupRepository
                .GetRequestByCitizenAndPeriodAsync(citizen.CitizenId, targetYear, targetMonth);

            if (existingMonthlyRequest != null &&
                !existingMonthlyRequest.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Citizen has already submitted a plastic waste pickup request for the {periodName} collection period.");
            }

            // Parse estimated volume safely
            var volume = string.IsNullOrWhiteSpace(dto.EstimatedVolume) ? "Medium" : dto.EstimatedVolume.Trim();
            if (!AllowedVolumes.Contains(volume))
            {
                volume = "Medium";
            }

            // Generate unique 4-digit verification code
            string code;
            do
            {
                code = Random.Shared.Next(1000, 10000).ToString();
            } while (await _pickupRepository.VerificationCodeExistsAsync(code));

            var request = new PickupRequest
            {
                RequestId = "REQ" + Random.Shared.Next(100000, 999999),
                CitizenId = citizen.CitizenId,
                WardId = citizen.WardId,
                EstimatedVolume = volume,
                OverallCategory = string.IsNullOrWhiteSpace(dto.OverallCategory) ? "Recyclable Plastic" : dto.OverallCategory.Trim(),
                AIAnalyzed = dto.AIAnalyzed,
                AIConfidence = dto.AIConfidence,
                SegregationAdvice = dto.SegregationAdvice ?? string.Empty,
                Status = "Pending",
                RequestedAt = requestTime,
                CollectionMonth = targetMonth,
                CollectionYear = targetYear,
                CollectionPeriodName = periodName,
                VerificationCode = code
            };

            await _pickupRepository.CreateAsync(request);

            return request;
        }

        public async Task<List<WardPickupRequestResponseDto>> GetAllRequestsAsync()
        {
            var rawRequests = await _pickupRepository.GetAllAsync();
            foreach (var req in rawRequests)
            {
                await CheckAndHandleDueNotificationAsync(req);
            }
            return await MapToResponseDtosAsync(rawRequests);
        }

        public static DateTime GetLocalTodayDate()
        {
            try
            {
                var ist = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ist).Date;
            }
            catch
            {
                return DateTime.UtcNow.AddMinutes(330).Date;
            }
        }

        public static DateTime ConvertToLocalDate(DateTime dt)
        {
            try
            {
                var ist = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime(), ist);
            }
            catch
            {
                return (dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime()).AddMinutes(330);
            }
        }

        /// <summary>
        /// Monthly pickup collection period is from the 20th to 25th.
        /// If a citizen creates a pickup request on or before the 25th, assign it to the current month's collection.
        /// If a citizen creates a pickup request after the 25th, automatically assign it to the NEXT month's collection.
        /// Examples:
        /// - October 24 -> October collection
        /// - October 25 -> October collection
        /// - October 26 -> November collection
        /// - October 31 -> November collection
        /// - November 25 -> November collection
        /// - November 26 -> December collection
        /// </summary>
        public static (int Year, int Month, string PeriodName) CalculateAssignedCollectionPeriod(DateTime requestedAt)
        {
            var localDate = ConvertToLocalDate(requestedAt);
            int year = localDate.Year;
            int month = localDate.Month;

            if (localDate.Day <= 25)
            {
                var monthName = System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(month);
                return (year, month, $"{monthName} {year}");
            }
            else
            {
                var nextMonthDate = new DateTime(year, month, 1).AddMonths(1);
                int nextYear = nextMonthDate.Year;
                int nextMonth = nextMonthDate.Month;
                var monthName = System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(nextMonth);
                return (nextYear, nextMonth, $"{monthName} {nextYear}");
            }
        }

        public static (int Year, int Month, string PeriodName) GetRequestCollectionPeriod(PickupRequest req)
        {
            if (req.CollectionYear.HasValue && req.CollectionMonth.HasValue && req.CollectionMonth.Value >= 1 && req.CollectionMonth.Value <= 12)
            {
                var monthName = System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(req.CollectionMonth.Value);
                return (req.CollectionYear.Value, req.CollectionMonth.Value, req.CollectionPeriodName ?? $"{monthName} {req.CollectionYear.Value}");
            }
            return CalculateAssignedCollectionPeriod(req.RequestedAt != default ? req.RequestedAt : DateTime.UtcNow);
        }

        private static void ApplyDueState(PickupRequest? req)
        {
            if (req == null) return;

            req.ScheduledDate ??= req.CollectionDate;
            req.CollectionDate ??= req.ScheduledDate;

            var s = req.Status ?? string.Empty;
            if (s.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
                s.Equals("Collected", StringComparison.OrdinalIgnoreCase) ||
                s.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                req.DueStatus = null;
                return;
            }

            var scheduledDate = req.ScheduledDate ?? req.CollectionDate;
            var localToday = GetLocalTodayDate();
            bool isDatePassed = scheduledDate.HasValue && localToday > scheduledDate.Value.Date;
            bool isExplicitDue = s.Contains("Due", StringComparison.OrdinalIgnoreCase);
            bool hasDueReason = !string.IsNullOrWhiteSpace(req.DueReason);
            bool hasDueStatus = !string.IsNullOrWhiteSpace(req.DueStatus);

            if (isDatePassed || isExplicitDue || hasDueReason || hasDueStatus)
            {
                if (req.AdminApprovalStatus?.Equals("Approved", StringComparison.OrdinalIgnoreCase) == true)
                {
                    req.DueStatus = "Approved for Reschedule";
                }
                else if (req.AdminApprovalStatus?.Equals("Rejected", StringComparison.OrdinalIgnoreCase) == true)
                {
                    req.DueStatus = "Rejected";
                }
                else if (hasDueReason)
                {
                    req.DueStatus = "Review Required";
                }
                else
                {
                    req.DueStatus = "Due / Review Required";
                }

                req.Status = "Due / Review Required";
            }
        }

        private async Task CheckAndHandleDueNotificationAsync(PickupRequest req)
        {
            if (req == null) return;
            var scheduledDate = req.ScheduledDate ?? req.CollectionDate;
            var localToday = GetLocalTodayDate();
            bool isDatePassed = scheduledDate.HasValue && localToday > scheduledDate.Value.Date;
            var s = req.Status ?? string.Empty;

            if (isDatePassed &&
                !s.Equals("Completed", StringComparison.OrdinalIgnoreCase) &&
                !s.Equals("Collected", StringComparison.OrdinalIgnoreCase) &&
                !s.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                if (!s.Contains("Due", StringComparison.OrdinalIgnoreCase))
                {
                    await _pickupRepository.UpdateDueStatusAsync(req.RequestId, "Due / Review Required");
                }

                // Notify Citizen when pickup becomes Due
                await _notificationService.NotifyUserAsync(
                    req.CitizenId,
                    "Citizen",
                    "Pickup Due / Review Required",
                    $"Your scheduled pickup (Request {req.RequestId}) collection date passed without completion. It has been marked as Due / Review Required. Worker must enter a reason for review.",
                    "pickup_due",
                    req.RequestId);
            }
        }

        public async Task<PickupRequest?> GetCurrentMonthRequestAsync(string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return null;

            var citizen = await GetCitizenAsync(citizenId);
            var targetId = citizen?.CitizenId ?? citizenId;

            _ = Task.Run(() => CheckCitizenPeriodNotificationsAsync(targetId));

            var req = await _pickupRepository.GetCurrentMonthRequestByCitizenIdAsync(targetId);
            if (req != null)
            {
                await CheckAndHandleDueNotificationAsync(req);
                ApplyDueState(req);
            }
            return req;
        }

        public async Task<List<PickupRequest>> GetCitizenRequestsAsync(string citizenId)
        {
            var citizen = await GetCitizenAsync(citizenId);
            var targetId = citizen?.CitizenId ?? citizenId;

            _ = Task.Run(() => CheckCitizenPeriodNotificationsAsync(targetId));

            var requests = await _pickupRepository.GetByCitizenIdAsync(targetId);
            foreach (var r in requests)
            {
                await CheckAndHandleDueNotificationAsync(r);
                ApplyDueState(r);
            }
            return requests;
        }

        public async Task<List<WardPickupRequestResponseDto>> GetWardRequestsAsync(string wardId, string? workerId = null)
        {
            string? workerEmail = null;
            string? workerCode = null;

            if (!string.IsNullOrWhiteSpace(workerId))
            {
                var cleanWorker = workerId.Trim();
                var worker = await _workerRepository.GetWorkerByEmailAsync(cleanWorker);
                if (worker == null)
                {
                    var allWorkers = await _workerRepository.GetAllWorkersAsync();
                    worker = allWorkers.FirstOrDefault(w =>
                        w.WorkerId.Equals(cleanWorker, StringComparison.OrdinalIgnoreCase) ||
                        w.Email.Equals(cleanWorker, StringComparison.OrdinalIgnoreCase));
                }

                workerEmail = worker?.Email ?? cleanWorker;
                workerCode = worker?.WorkerId ?? cleanWorker;
            }

            var rawRequests = await _pickupRepository.GetWardRequestsAsync(wardId, workerEmail, workerCode);
            foreach (var r in rawRequests)
            {
                await CheckAndHandleDueNotificationAsync(r);
            }
            return await MapToResponseDtosAsync(rawRequests);
        }

        public async Task<List<WardPickupRequestResponseDto>> GetWorkerRequestsAsync(string workerId)
        {
            if (string.IsNullOrWhiteSpace(workerId)) return new List<WardPickupRequestResponseDto>();

            var cleanWorker = workerId.Trim();
            var worker = await _workerRepository.GetWorkerByEmailAsync(cleanWorker);
            if (worker == null)
            {
                var allWorkers = await _workerRepository.GetAllWorkersAsync();
                worker = allWorkers.FirstOrDefault(w =>
                    w.WorkerId.Equals(cleanWorker, StringComparison.OrdinalIgnoreCase) ||
                    w.Email.Equals(cleanWorker, StringComparison.OrdinalIgnoreCase));
            }

            var workerEmail = worker?.Email ?? cleanWorker;
            var workerCode = worker?.WorkerId ?? cleanWorker;
            var wardId = worker?.WardId;

            var rawRequests = await _pickupRepository.GetWorkerRequestsAsync(workerEmail, workerCode, wardId);
            foreach (var r in rawRequests)
            {
                await CheckAndHandleDueNotificationAsync(r);
            }
            return await MapToResponseDtosAsync(rawRequests);
        }

        private async Task<List<WardPickupRequestResponseDto>> MapToResponseDtosAsync(List<PickupRequest> rawRequests)
        {
            var allCitizens = await _citizenRepository.GetAllCitizensAsync();
            var citizenDict = new Dictionary<string, Citizen>(StringComparer.OrdinalIgnoreCase);
            foreach (var c in allCitizens)
            {
                if (!string.IsNullOrWhiteSpace(c.CitizenId))
                {
                    citizenDict[c.CitizenId] = c;
                }
            }

            var responseList = new List<WardPickupRequestResponseDto>();

            foreach (var req in rawRequests)
            {
                ApplyDueState(req);
                citizenDict.TryGetValue(req.CitizenId, out var citizen);
                var (targetYear, targetMonth, periodName) = GetRequestCollectionPeriod(req);

                responseList.Add(new WardPickupRequestResponseDto
                {
                    Id = req.Id,
                    RequestId = req.RequestId,
                    CitizenId = req.CitizenId,
                    WardId = req.WardId,
                    EstimatedVolume = string.IsNullOrWhiteSpace(req.EstimatedVolume) ? "Medium" : req.EstimatedVolume,
                    OverallCategory = req.OverallCategory,
                    Status = req.Status.Equals("Collected", StringComparison.OrdinalIgnoreCase) ? "Completed" : req.Status,
                    AcceptedByWorkerId = req.AcceptedByWorkerId,
                    AcceptedAt = req.AcceptedAt,
                    CollectionDate = req.CollectionDate,
                    ScheduledDate = req.ScheduledDate ?? req.CollectionDate,
                    CollectionMonth = targetMonth,
                    CollectionYear = targetYear,
                    CollectionPeriodName = periodName,
                    DueStatus = req.DueStatus,
                    DueReason = req.DueReason,
                    DueReasonSubmittedAt = req.DueReasonSubmittedAt,
                    DueReasonSubmittedBy = req.DueReasonSubmittedBy,
                    CitizenApprovalStatus = req.CitizenApprovalStatus,
                    CitizenApprovedAt = req.CitizenApprovedAt,
                    AdminApprovalStatus = req.AdminApprovalStatus,
                    AdminApprovedAt = req.AdminApprovedAt,
                    RequestedAt = req.RequestedAt,
                    CollectedAt = req.CollectedAt,
                    AIAnalyzed = req.AIAnalyzed,
                    AIConfidence = req.AIConfidence,
                    SegregationAdvice = req.SegregationAdvice ?? "",
                    VerificationCode = req.VerificationCode ?? "",
                    // Dynamic citizen details
                    CitizenName = citizen?.FullName ?? "Citizen",
                    HouseName = citizen?.HouseName ?? "",
                    HouseNumber = citizen?.HouseNumber ?? "",
                    Address = citizen?.Address ?? "",
                    Latitude = citizen?.Latitude ?? 0,
                    Longitude = citizen?.Longitude ?? 0,
                    PhoneNumber = citizen?.PhoneNumber ?? ""
                });
            }

            return responseList;
        }

        public async Task<bool> ScheduleRequestAsync(string requestId, string workerId, DateTime collectionDate)
        {
            if (string.IsNullOrWhiteSpace(requestId) || string.IsNullOrWhiteSpace(workerId))
            {
                throw new ArgumentException("Request ID and Worker ID are required.");
            }

            var request = await _pickupRepository.GetByRequestIdAsync(requestId);
            if (request == null)
            {
                throw new ArgumentException("Pickup request not found.");
            }

            ApplyDueState(request);

            var localToday = GetLocalTodayDate();
            var (targetYear, targetMonth, periodName) = GetRequestCollectionPeriod(request);

            // 1. Past dates must never be allowed
            if (collectionDate.Date < localToday)
            {
                throw new ArgumentException("Past dates are not allowed. Please select a valid future date.");
            }

            // 2. Scheduled date must be within request's assigned collection month & year
            if (collectionDate.Year != targetYear || collectionDate.Month != targetMonth)
            {
                throw new ArgumentException($"Scheduled date must be within the request's assigned collection month ({periodName}). Selected date was {collectionDate:dd MMM yyyy}.");
            }

            // 3. Valid date within 20–25 collection period
            if (collectionDate.Day < 20 || collectionDate.Day > 25)
            {
                throw new ArgumentException("Worker collection date must be scheduled between the 20th and 25th of the collection period.");
            }

            var scheduledDate = request.ScheduledDate ?? request.CollectionDate;
            bool isPast = scheduledDate.HasValue && localToday > scheduledDate.Value.Date;
            bool isDueState = isPast || request.Status.Contains("Due", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(request.DueStatus);

            if (isDueState)
            {
                // Worker must NOT be allowed to reschedule before Admin approval
                if (request.AdminApprovalStatus?.Equals("Approved", StringComparison.OrdinalIgnoreCase) != true)
                {
                    if (request.AdminApprovalStatus?.Equals("Rejected", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        throw new InvalidOperationException("Admin rejected this missed pickup. The pickup remains locked and cannot be rescheduled.");
                    }
                    throw new InvalidOperationException("Worker is not allowed to reschedule before Admin approval. The missed pickup is pending Admin review.");
                }
            }

            var updated = await _pickupRepository.ScheduleRequestAsync(requestId, workerId, collectionDate);
            if (updated)
            {
                // Notify Citizen when Worker schedules the date
                string dateStr = collectionDate.ToString("dd MMM yyyy");
                await _notificationService.NotifyUserAsync(
                    request.CitizenId,
                    "Citizen",
                    "New Pickup Date Scheduled",
                    $"A collection date has been scheduled for request {request.RequestId} on {dateStr} (20th–25th collection window of {periodName}). Please keep dry recyclable plastic ready.",
                    "pickup_scheduled",
                    request.RequestId);

                // If scheduled for today, immediately trigger "Pickup Scheduled for Today" notification
                if (collectionDate.Date == localToday)
                {
                    await _notificationService.NotifyUserAsync(
                        request.CitizenId,
                        "Citizen",
                        "Pickup Scheduled for Today",
                        $"Your plastic waste pickup (Request {request.RequestId}) is scheduled for today ({dateStr}). Haritha Karma Sena workers will arrive for doorstep waste collection.",
                        "pickup_today",
                        $"TODAY_{request.RequestId}_{localToday:yyyyMMdd}");
                }
            }

            return updated;
        }

        public async Task<bool> CompleteRequestAsync(string requestId, string? workerId = null, string verificationCode = "")
        {
            if (string.IsNullOrWhiteSpace(requestId))
            {
                throw new ArgumentException("Request ID is required.");
            }

            var request = await _pickupRepository.GetByRequestIdAsync(requestId);
            if (request == null)
            {
                throw new ArgumentException("Pickup request not found.");
            }

            ApplyDueState(request);

            if (request.Status.Contains("Due", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(request.DueStatus))
            {
                throw new InvalidOperationException("Worker cannot complete a Due / Review Required pickup. It must be reviewed and approved by Admin and rescheduled before completion.");
            }

            if (!request.Status.Equals("Scheduled", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Only valid 'Scheduled' requests can be completed. Current status is '{request.Status}'.");
            }

            if (!string.IsNullOrWhiteSpace(workerId) && 
                !string.IsNullOrWhiteSpace(request.AcceptedByWorkerId) &&
                !request.AcceptedByWorkerId.Equals(workerId.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                var cleanWorkerId = workerId.Trim();
                var worker = await _workerRepository.GetWorkerByEmailAsync(cleanWorkerId);
                bool matched = false;
                if (worker != null)
                {
                    matched = request.AcceptedByWorkerId.Equals(worker.WorkerId, StringComparison.OrdinalIgnoreCase) ||
                              request.AcceptedByWorkerId.Equals(worker.Email, StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    var allWorkers = await _workerRepository.GetAllWorkersAsync();
                    var w = allWorkers.FirstOrDefault(x => x.WorkerId.Equals(cleanWorkerId, StringComparison.OrdinalIgnoreCase));
                    if (w != null)
                    {
                        matched = request.AcceptedByWorkerId.Equals(w.WorkerId, StringComparison.OrdinalIgnoreCase) ||
                                  request.AcceptedByWorkerId.Equals(w.Email, StringComparison.OrdinalIgnoreCase);
                    }
                }

                if (!matched)
                {
                    throw new InvalidOperationException("Only the assigned worker can complete this pickup request.");
                }
            }

            // Verify unique verification code provided by citizen
            if (string.IsNullOrWhiteSpace(verificationCode))
            {
                throw new ArgumentException("Verification code is required to complete pickup.");
            }

            if (!string.Equals(request.VerificationCode?.Trim(), verificationCode.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Invalid verification code. Please check with citizen and enter the correct 4-digit code.");
            }

            var updated = await _pickupRepository.CompleteRequestAsync(requestId);
            if (updated)
            {
                await _notificationService.NotifyUserAsync(
                    request.CitizenId,
                    "Citizen",
                    "Pickup Completed Successfully",
                    $"Doorstep plastic collection for request {request.RequestId} has been verified and completed successfully by Haritha Karma Sena.",
                    "pickup_completed",
                    request.RequestId);
            }

            return updated;
        }

        public async Task<bool> SubmitDueReasonAsync(string requestId, string reason, string? submittedBy = null)
        {
            if (string.IsNullOrWhiteSpace(requestId))
            {
                throw new ArgumentException("Request ID is required.");
            }
            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new ArgumentException("Due reason is required.");
            }

            var request = await _pickupRepository.GetByRequestIdAsync(requestId);
            if (request == null)
            {
                throw new ArgumentException("Pickup request not found.");
            }

            if (request.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
                request.Status.Equals("Collected", StringComparison.OrdinalIgnoreCase) ||
                request.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Cannot submit a due reason for a completed or cancelled request.");
            }

            // Worker enters reason for missed pickup
            var result = await _pickupRepository.SubmitDueReasonAsync(requestId, reason, "Worker");
            if (result)
            {
                await _notificationService.NotifyUserAsync(
                    request.CitizenId,
                    "Citizen",
                    "Worker Recorded Missed Pickup Reason",
                    $"Worker recorded reason for missed pickup (Request {request.RequestId}): \"{reason.Trim()}\". Under Panchayat Admin review.",
                    "pickup_due_reason",
                    request.RequestId);
            }
            return result;
        }

        public async Task<bool> ApproveDueReasonAsync(string requestId, string approvedByRole, string action = "Approve")
        {
            if (string.IsNullOrWhiteSpace(requestId))
            {
                throw new ArgumentException("Request ID is required.");
            }
            if (string.IsNullOrWhiteSpace(approvedByRole))
            {
                throw new ArgumentException("Approver role is required.");
            }

            // Citizen is only allowed to view; no approval or rescheduling option for Citizen.
            // Admin must review the missed pickup.
            if (!approvedByRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Only an Administrator can review missed pickups. Citizens are not allowed to approve or reject.");
            }

            var request = await _pickupRepository.GetByRequestIdAsync(requestId);
            if (request == null)
            {
                throw new ArgumentException("Pickup request not found.");
            }

            if (string.IsNullOrWhiteSpace(request.DueReason))
            {
                throw new InvalidOperationException("Worker must enter a reason for the missed pickup before Admin can review.");
            }

            var success = await _pickupRepository.ApproveDueReasonAsync(requestId, "Admin", action);
            if (success)
            {
                bool isApprove = action.Equals("Approve", StringComparison.OrdinalIgnoreCase);
                if (isApprove)
                {
                    // Notify Citizen when Admin approves
                    await _notificationService.NotifyUserAsync(
                        request.CitizenId,
                        "Citizen",
                        "Missed Pickup Approved by Admin",
                        $"Admin has reviewed and approved the missed pickup reason for request {request.RequestId}. Worker is now authorized to schedule a new collection date.",
                        "admin_approved",
                        request.RequestId);
                }
                else
                {
                    await _notificationService.NotifyUserAsync(
                        request.CitizenId,
                        "Citizen",
                        "Missed Pickup Rejected by Admin",
                        $"Admin has reviewed and rejected the missed pickup explanation for request {request.RequestId}. The pickup remains locked.",
                        "admin_rejected",
                        request.RequestId);
                }
            }

            return success;
        }

        public async Task<bool> UpdateStatusAsync(string requestId, string status)
        {
            var allowedStatuses = new[] { "Pending", "Scheduled", "Due", "Due / Review Required", "Completed", "Cancelled" };

            if (!allowedStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Invalid pickup request status.");
            }

            return await _pickupRepository.UpdateStatusAsync(requestId, status);
        }

        public async Task CheckCitizenPeriodNotificationsAsync(string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return;
            var cleanCitizen = citizenId.Trim();
            var localToday = GetLocalTodayDate();
            int day = localToday.Day;
            int month = localToday.Month;
            int year = localToday.Year;
            string monthName = System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(month);

            // 1. Pickup period opened (20th–25th)
            if (day >= 20 && day <= 25)
            {
                string key = $"PERIOD_OPEN_{year}_{month}";
                await _notificationService.NotifyUserAsync(
                    cleanCitizen,
                    "Citizen",
                    "Pickup Period Opened",
                    $"The monthly 20th–25th collection period for {monthName} {year} is now open! Haritha Karma Sena workers will collect doorstep plastic waste during this period.",
                    "pickup_period_opened",
                    key);
            }

            // 2. Pickup period ending soon (24th or 25th)
            if (day == 24 || day == 25)
            {
                string key = $"PERIOD_ENDING_{year}_{month}";
                await _notificationService.NotifyUserAsync(
                    cleanCitizen,
                    "Citizen",
                    "Pickup Period Ending Soon",
                    $"The monthly collection period for {monthName} ends on the 25th. If your plastic waste has not been collected yet, your assigned worker will be visiting shortly.",
                    "pickup_period_ending_soon",
                    key);
            }

            // 3. Pickup period ended (after 25th)
            if (day > 25)
            {
                var nextMonthDate = new DateTime(year, month, 1).AddMonths(1);
                string nextMonthName = System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(nextMonthDate.Month);
                string key = $"PERIOD_ENDED_{year}_{month}";
                await _notificationService.NotifyUserAsync(
                    cleanCitizen,
                    "Citizen",
                    "Pickup Period Ended",
                    $"The collection period for {monthName} {year} has ended. New pickup requests will automatically be assigned to the {nextMonthName} {nextMonthDate.Year} collection period (20th–25th).",
                    "pickup_period_ended",
                    key);
            }

            // 4. Pickup scheduled for today
            try
            {
                var citizenRequests = await _pickupRepository.GetByCitizenIdAsync(cleanCitizen);
                var todayReq = citizenRequests.FirstOrDefault(r =>
                    (r.ScheduledDate?.Date == localToday || r.CollectionDate?.Date == localToday) &&
                    !r.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) &&
                    !r.Status.Equals("Collected", StringComparison.OrdinalIgnoreCase) &&
                    !r.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase));

                if (todayReq != null)
                {
                    string key = $"TODAY_{todayReq.RequestId}_{localToday:yyyyMMdd}";
                    await _notificationService.NotifyUserAsync(
                        cleanCitizen,
                        "Citizen",
                        "Pickup Scheduled for Today",
                        $"Your plastic waste pickup (Request {todayReq.RequestId}) is scheduled for today. Please keep dry segregated plastic ready at your gate.",
                        "pickup_today",
                        key);
                }
            }
            catch
            {
                // Fail silently without disrupting requests
            }
        }

        private async Task<Citizen?> GetCitizenAsync(string citizenId)
        {
            var citizens = await _citizenRepository.GetAllCitizensAsync();

            return citizens.FirstOrDefault(x =>
                x.CitizenId.Equals(citizenId, StringComparison.OrdinalIgnoreCase) ||
                x.Id.Equals(citizenId, StringComparison.OrdinalIgnoreCase) ||
                x.Email.Equals(citizenId, StringComparison.OrdinalIgnoreCase));
        }
    }
}