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

        private static readonly HashSet<string> AllowedVolumes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Small",
            "Medium",
            "Large"
        };

        public PickupRequestService(
            IPickupRequestRepository pickupRepository,
            ICitizenRepository citizenRepository,
            IWorkerRepository workerRepository)
        {
            _pickupRepository = pickupRepository;
            _citizenRepository = citizenRepository;
            _workerRepository = workerRepository;
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

            // Check if citizen already has a pickup request for the current calendar month
            var existingMonthlyRequest = await _pickupRepository
                .GetCurrentMonthRequestByCitizenIdAsync(citizen.CitizenId);

            if (existingMonthlyRequest != null)
            {
                throw new InvalidOperationException("Citizen has already submitted a plastic waste pickup request for this month.");
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
                RequestedAt = DateTime.UtcNow,
                VerificationCode = code
            };

            await _pickupRepository.CreateAsync(request);

            return request;
        }

        public async Task<List<WardPickupRequestResponseDto>> GetAllRequestsAsync()
        {
            var rawRequests = await _pickupRepository.GetAllAsync();
            return await MapToResponseDtosAsync(rawRequests);
        }

        public async Task<PickupRequest?> GetCurrentMonthRequestAsync(string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return null;

            var citizen = await GetCitizenAsync(citizenId);
            var targetId = citizen?.CitizenId ?? citizenId;

            return await _pickupRepository.GetCurrentMonthRequestByCitizenIdAsync(targetId);
        }

        public async Task<List<PickupRequest>> GetCitizenRequestsAsync(string citizenId)
        {
            var citizen = await GetCitizenAsync(citizenId);
            var targetId = citizen?.CitizenId ?? citizenId;

            return await _pickupRepository.GetByCitizenIdAsync(targetId);
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
                citizenDict.TryGetValue(req.CitizenId, out var citizen);

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

            if (!request.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Only 'Pending' requests can be scheduled. Current status is '{request.Status}'.");
            }

            if (collectionDate.Day < 15 || collectionDate.Day > 25)
            {
                throw new ArgumentException("Worker collection date must be scheduled between the 15th and 25th of the collection month.");
            }

            return await _pickupRepository.ScheduleRequestAsync(requestId, workerId, collectionDate);
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

            if (!request.Status.Equals("Scheduled", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Only 'Scheduled' requests can be completed. Current status is '{request.Status}'.");
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

            return await _pickupRepository.CompleteRequestAsync(requestId);
        }

        public async Task<bool> UpdateStatusAsync(string requestId, string status)
        {
            var allowedStatuses = new[] { "Pending", "Scheduled", "Completed", "Cancelled" };

            if (!allowedStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Invalid pickup request status.");
            }

            return await _pickupRepository.UpdateStatusAsync(requestId, status);
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