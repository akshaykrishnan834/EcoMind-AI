using BCrypt.Net;
using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;


namespace EcoMind.API.Services
{
    public class WorkerService : IWorkerService
    {
        private readonly IWorkerRepository _workerRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPickupRequestRepository _pickupRepository;

        public WorkerService(
            IWorkerRepository workerRepository,
            IUserRepository userRepository,
            IPickupRequestRepository pickupRepository)
        {
            _workerRepository = workerRepository;
            _userRepository = userRepository;
            _pickupRepository = pickupRepository;
        }

        public async Task<string> CreateWorkerAsync(CreateWorkerDto dto)
        {
            // Check if email already exists in User collection
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                return "Email already exists in user accounts.";
            }

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                var existingPhoneUser = await _userRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
                if (existingPhoneUser != null)
                {
                    return "Phone number already exists in user accounts.";
                }
            }

            var existingWorker = await _workerRepository.GetWorkerByEmailAsync(dto.Email);
            if (existingWorker != null)
            {
                return "Worker with this email already exists.";
            }

            string rawPassword = string.IsNullOrWhiteSpace(dto.Password) ? "Worker@123" : dto.Password;
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(rawPassword);

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Password = hashedPassword,
                Role = "Worker",
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);

            var worker = new Worker
            {
                WorkerId = "WRK-" + Guid.NewGuid().ToString("N")[..6].ToUpper(),
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                WardId = dto.WardId,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _workerRepository.CreateWorkerAsync(worker);

            return "Worker Created Successfully";
        }

        public async Task<List<Worker>> GetAllWorkersAsync()
        {
            return await _workerRepository.GetAllWorkersAsync();
        }

        public async Task<string> UpdateWorkerAsync(UpdateWorkerDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Id))
            {
                return "Invalid worker ID.";
            }

            var workers = await _workerRepository.GetAllWorkersAsync();
            var worker = workers.FirstOrDefault(w => w.Id == dto.Id);
            if (worker == null)
            {
                return "Worker record not found.";
            }

            string cleanPhone = dto.PhoneNumber?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(cleanPhone) || cleanPhone.Length != 10 || !System.Text.RegularExpressions.Regex.IsMatch(cleanPhone, "^[6-9][0-9]{9}$"))
            {
                return "Phone number must contain exactly 10 digits starting with 6, 7, 8, or 9.";
            }

            var existingUserWithPhone = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
            var user = await _userRepository.GetByEmailAsync(worker.Email);

            if (existingUserWithPhone != null && (user == null || existingUserWithPhone.Id != user.Id))
            {
                return "Phone number is already registered to another account.";
            }

            worker.FullName = string.IsNullOrWhiteSpace(dto.FullName) ? worker.FullName : dto.FullName.Trim();
            worker.PhoneNumber = cleanPhone;
            worker.WardId = dto.WardId ?? worker.WardId;
            worker.Status = string.IsNullOrWhiteSpace(dto.Status) ? worker.Status : dto.Status.Trim();

            await _workerRepository.UpdateWorkerAsync(worker);

            if (user != null)
            {
                user.FullName = worker.FullName;
                user.PhoneNumber = cleanPhone;
                await _userRepository.UpdateAsync(user);
            }

            return "Worker Updated Successfully";
        }

        public async Task<string> UpdateDutyStatusAsync(UpdateWorkerDutyDto dto)
        {
            if (dto == null)
            {
                return "Invalid duty update payload.";
            }

            Worker? worker = null;

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                worker = await _workerRepository.GetWorkerByEmailAsync(dto.Email.Trim());
            }

            if (worker == null && !string.IsNullOrWhiteSpace(dto.WorkerId))
            {
                var allWorkers = await _workerRepository.GetAllWorkersAsync();
                worker = allWorkers.FirstOrDefault(w => 
                    string.Equals(w.WorkerId, dto.WorkerId, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(w.Id, dto.WorkerId, StringComparison.OrdinalIgnoreCase));
            }

            if (worker == null)
            {
                return "Worker not found.";
            }

            worker.IsOnDuty = dto.IsOnDuty;
            if (dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                worker.CurrentLatitude = dto.Latitude.Value;
                worker.CurrentLongitude = dto.Longitude.Value;
            }
            worker.LastLocationUpdatedAt = DateTime.UtcNow;

            await _workerRepository.UpdateWorkerAsync(worker);
            return "Duty status updated successfully.";
        }

        public async Task<LiveWorkerTrackingDto?> GetLiveWorkerByWardAsync(
            string wardId,
            string? citizenId = null,
            string? requestId = null)
        {
            if (string.IsNullOrWhiteSpace(wardId))
            {
                return null;
            }

            var cleanWard = wardId.Trim();
            var workers = await _workerRepository.GetWorkersByWardIdAsync(cleanWard);

            // Active on-duty worker with live GPS; fallback to first ward worker
            var activeWorker = workers.FirstOrDefault(w => w.IsOnDuty);
            var targetWorker = activeWorker ?? workers.FirstOrDefault();

            if (targetWorker == null)
            {
                return null;
            }

            var isOnDuty = activeWorker != null && targetWorker.IsOnDuty;
            var trackingDto = new LiveWorkerTrackingDto
            {
                Id = targetWorker.Id,
                WorkerId = targetWorker.WorkerId,
                FullName = targetWorker.FullName,
                Email = targetWorker.Email,
                PhoneNumber = targetWorker.PhoneNumber,
                WardId = targetWorker.WardId,
                CurrentWardId = targetWorker.CurrentWardId,
                Status = targetWorker.Status,
                IsOnDuty = isOnDuty,
                CurrentLatitude = isOnDuty ? targetWorker.CurrentLatitude : null,
                CurrentLongitude = isOnDuty ? targetWorker.CurrentLongitude : null,
                LastLocationUpdatedAt = targetWorker.LastLocationUpdatedAt,
                IsTrackingAllowed = true,
                TrackingReason = "Active worker tracking"
            };

            // Citizen-specific scheduled pickup gating
            bool isCitizenGatingRequested = !string.IsNullOrWhiteSpace(citizenId) || !string.IsNullOrWhiteSpace(requestId);
            if (!isCitizenGatingRequested)
            {
                return trackingDto;
            }

            // Resolve pickup request
            PickupRequest? req = null;
            if (!string.IsNullOrWhiteSpace(requestId))
            {
                req = await _pickupRepository.GetByRequestIdAsync(requestId.Trim());
            }

            if (req == null && !string.IsNullOrWhiteSpace(citizenId))
            {
                var cleanCitizen = citizenId.Trim();
                req = await _pickupRepository.GetCurrentMonthRequestByCitizenIdAsync(cleanCitizen);
                if (req == null)
                {
                    var allCitizenReqs = await _pickupRepository.GetByCitizenIdAsync(cleanCitizen);
                    req = allCitizenReqs.FirstOrDefault(r => 
                        !r.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) &&
                        !r.Status.Equals("Collected", StringComparison.OrdinalIgnoreCase) &&
                        !r.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
                        ?? allCitizenReqs.FirstOrDefault();
                }
            }

            if (req == null)
            {
                trackingDto.IsTrackingAllowed = false;
                trackingDto.CurrentLatitude = null;
                trackingDto.CurrentLongitude = null;
                trackingDto.TrackingReason = "No active pickup request found for this citizen.";
                return trackingDto;
            }

            trackingDto.PickupRequestId = req.RequestId;
            trackingDto.PickupStatus = req.Status;

            // 1. Disable tracking for cancelled pickups
            if (req.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                trackingDto.IsTrackingAllowed = false;
                trackingDto.IsCancelled = true;
                trackingDto.CurrentLatitude = null;
                trackingDto.CurrentLongitude = null;
                trackingDto.TrackingReason = "Pickup request was cancelled. Live tracking is disabled.";
                return trackingDto;
            }

            // 2. Disable tracking for completed pickups
            if (req.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
                req.Status.Equals("Collected", StringComparison.OrdinalIgnoreCase))
            {
                trackingDto.IsTrackingAllowed = false;
                trackingDto.IsCompleted = true;
                trackingDto.CurrentLatitude = null;
                trackingDto.CurrentLongitude = null;
                trackingDto.TrackingReason = "Pickup request is completed. Live tracking has concluded.";
                return trackingDto;
            }

            // 3. Follow updated date if rescheduled
            var scheduledDate = req.ScheduledDate ?? req.CollectionDate;
            trackingDto.ScheduledDate = scheduledDate;
            trackingDto.IsRescheduled = req.DueStatus?.Equals("Approved for Reschedule", StringComparison.OrdinalIgnoreCase) == true ||
                                        req.AdminApprovalStatus?.Equals("Approved", StringComparison.OrdinalIgnoreCase) == true ||
                                        !string.IsNullOrWhiteSpace(req.DueReason);

            if (!scheduledDate.HasValue)
            {
                trackingDto.IsTrackingAllowed = false;
                trackingDto.CurrentLatitude = null;
                trackingDto.CurrentLongitude = null;
                trackingDto.TrackingReason = "Pickup request has not been assigned a scheduled date yet.";
                return trackingDto;
            }

            var localToday = PickupRequestService.GetLocalTodayDate();
            var localScheduledDate = PickupRequestService.ConvertToLocalDate(scheduledDate.Value).Date;
            trackingDto.FormattedScheduledDate = localScheduledDate.ToString("dd MMM yyyy");

            if (localToday < localScheduledDate)
            {
                // Before scheduled date: hide live tracking map & show scheduled date
                trackingDto.IsTrackingAllowed = false;
                trackingDto.IsBeforeScheduledDate = true;
                trackingDto.IsToday = false;
                trackingDto.CurrentLatitude = null;
                trackingDto.CurrentLongitude = null;
                trackingDto.TrackingReason = $"Live tracking will be active on your scheduled pickup date: {trackingDto.FormattedScheduledDate}.";
            }
            else if (localToday == localScheduledDate)
            {
                // On scheduled date: live tracking allowed
                trackingDto.IsTrackingAllowed = true;
                trackingDto.IsToday = true;
                trackingDto.IsBeforeScheduledDate = false;
                trackingDto.IsAfterScheduledDate = false;
                trackingDto.TrackingReason = $"Today is your scheduled pickup date ({trackingDto.FormattedScheduledDate}). Live tracking is active.";
            }
            else
            {
                // After scheduled date (missed/passed): hide live tracking
                trackingDto.IsTrackingAllowed = false;
                trackingDto.IsAfterScheduledDate = true;
                trackingDto.IsToday = false;
                trackingDto.CurrentLatitude = null;
                trackingDto.CurrentLongitude = null;
                trackingDto.TrackingReason = $"Scheduled pickup date ({trackingDto.FormattedScheduledDate}) has passed. Live tracking is inactive.";
            }

            return trackingDto;
        }
    }
}