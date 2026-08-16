using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class PickupRequestService : IPickupRequestService
    {
        private readonly IPickupRequestRepository _pickupRepository;
        private readonly ICitizenRepository _citizenRepository;

        // Allowed plastic pickup categories strictly (Requirement 7)
        private static readonly HashSet<string> AllowedPickupCategories = new(StringComparer.OrdinalIgnoreCase)
        {
            "Plastic Bottles",
            "Plastic Covers / Wrappers",
            "Other recyclable plastic"
        };

        public PickupRequestService(
            IPickupRequestRepository pickupRepository,
            ICitizenRepository citizenRepository)
        {
            _pickupRepository = pickupRepository;
            _citizenRepository = citizenRepository;
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

            // Check if citizen already has a pickup request for the current calendar month (Requirement 1 & 8)
            var existingMonthlyRequest = await _pickupRepository
                .GetCurrentMonthRequestByCitizenIdAsync(citizen.CitizenId);

            if (existingMonthlyRequest != null)
            {
                throw new InvalidOperationException("Your monthly plastic pickup request has already been submitted.");
            }

            // Citizen must have house details
            if (string.IsNullOrWhiteSpace(citizen.HouseNumber))
            {
                throw new InvalidOperationException(
                    "Please complete your house number in your profile before requesting pickup.");
            }

            // Citizen must have location
            if (citizen.Latitude == 0 && citizen.Longitude == 0)
            {
                throw new InvalidOperationException(
                    "Please set your house location in your profile before requesting pickup.");
            }

            // Filter items strictly to allowed plastic categories (Requirement 7)
            var validPickupItems = dto.WasteItems?
                .Where(x => AllowedPickupCategories.Contains(x.Type?.Trim() ?? ""))
                .Select(x => new WasteItem
                {
                    Type = x.Type.Trim(),
                    Quantity = Math.Max(1, x.Quantity)
                })
                .ToList() ?? new List<WasteItem>();

            if (validPickupItems.Count == 0)
            {
                throw new ArgumentException("Pickup requests are strictly for eligible plastic materials (Plastic Bottles, Plastic Covers / Wrappers, or Other recyclable plastic). Non-plastic items like glass, paper, cardboard, and medicine blister packs are not accepted.");
            }

            // Create pickup request (Status = Pending, CollectionDate = null)
            var request = new PickupRequest
            {
                RequestId = "REQ" + Random.Shared.Next(100000, 999999),
                CitizenId = citizen.CitizenId,
                WardId = citizen.WardId,
                WasteItems = validPickupItems,
                OverallCategory = "Recyclable Plastic",
                AIAnalyzed = dto.AIAnalyzed,
                AIConfidence = dto.AIConfidence,
                SegregationAdvice = string.IsNullOrWhiteSpace(dto.SegregationAdvice)
                    ? "Keep recyclable plastics clean, dry, and bundled."
                    : dto.SegregationAdvice.Trim(),
                Status = "Pending",
                CollectionDate = null,
                RequestedAt = DateTime.UtcNow
            };

            await _pickupRepository.CreateAsync(request);

            return request;
        }

        public async Task<List<WardPickupRequestResponseDto>> GetAllRequestsAsync()
        {
            var rawRequests = await _pickupRepository.GetAllAsync();
            var allCitizens = await _citizenRepository.GetAllCitizensAsync();
            var citizenDict = allCitizens.ToDictionary(
                c => c.CitizenId, 
                c => c, 
                StringComparer.OrdinalIgnoreCase);

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
                    WasteItems = req.WasteItems,
                    OverallCategory = req.OverallCategory,
                    AIAnalyzed = req.AIAnalyzed,
                    AIConfidence = req.AIConfidence,
                    SegregationAdvice = req.SegregationAdvice,
                    Status = req.Status,
                    AcceptedByWorkerId = req.AcceptedByWorkerId,
                    AcceptedAt = req.AcceptedAt,
                    CollectionDate = req.CollectionDate,
                    RequestedAt = req.RequestedAt,
                    CollectedAt = req.CollectedAt,
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

        public async Task<List<WardPickupRequestResponseDto>> GetWardRequestsAsync(string wardId)
        {
            var rawRequests = await _pickupRepository.GetWardRequestsAsync(wardId);
            var allCitizens = await _citizenRepository.GetAllCitizensAsync();
            var citizenDict = allCitizens.ToDictionary(
                c => c.CitizenId, 
                c => c, 
                StringComparer.OrdinalIgnoreCase);

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
                    WasteItems = req.WasteItems,
                    OverallCategory = req.OverallCategory,
                    AIAnalyzed = req.AIAnalyzed,
                    AIConfidence = req.AIConfidence,
                    SegregationAdvice = req.SegregationAdvice,
                    Status = req.Status,
                    AcceptedByWorkerId = req.AcceptedByWorkerId,
                    AcceptedAt = req.AcceptedAt,
                    CollectionDate = req.CollectionDate,
                    RequestedAt = req.RequestedAt,
                    CollectedAt = req.CollectedAt,
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

            // Validate status is Pending (Requirement 3)
            if (!request.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Only 'Pending' requests can be scheduled. Current status is '{request.Status}'.");
            }

            // Validate collection date is between 15th and 25th of the month (Requirement 3)
            if (collectionDate.Day < 15 || collectionDate.Day > 25)
            {
                throw new ArgumentException("Worker collection date must be scheduled between the 15th and 25th of the collection month.");
            }

            // Perform schedule update: Status = "Scheduled", AcceptedByWorkerId = workerId, AcceptedAt = UtcNow, CollectionDate = collectionDate
            return await _pickupRepository.ScheduleRequestAsync(requestId, workerId, collectionDate);
        }

        public async Task<bool> CompleteRequestAsync(string requestId, string? workerId = null)
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

            // Validate status is Scheduled (Requirement 4)
            if (!request.Status.Equals("Scheduled", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Only 'Scheduled' requests can be completed. Current status is '{request.Status}'.");
            }

            // If worker ID provided, validate assigned worker (Requirement 4)
            if (!string.IsNullOrWhiteSpace(workerId) && 
                !string.IsNullOrWhiteSpace(request.AcceptedByWorkerId) &&
                !request.AcceptedByWorkerId.Equals(workerId, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Only the assigned worker can complete this pickup request.");
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