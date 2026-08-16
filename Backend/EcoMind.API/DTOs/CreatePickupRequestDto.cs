using EcoMind.API.Models;

namespace EcoMind.API.DTOs
{
    public class CreatePickupRequestDto
    {
        public string CitizenId { get; set; } = string.Empty;

        public List<WasteItemDto> WasteItems { get; set; } = new();

        public string OverallCategory { get; set; } = "Recyclable Plastic";

        public bool AIAnalyzed { get; set; } = false;

        public double AIConfidence { get; set; } = 0;

        public string SegregationAdvice { get; set; } = string.Empty;
    }

    public class WasteItemDto
    {
        public string Type { get; set; } = string.Empty;

        public int Quantity { get; set; }
    }

    public class SchedulePickupRequestDto
    {
        public string WorkerId { get; set; } = string.Empty;

        public DateTime CollectionDate { get; set; }
    }

    public class CompletePickupRequestDto
    {
        public string? WorkerId { get; set; }
    }

    // Response DTO for Ward Worker view that dynamically retrieves Citizen details without duplicating them in DB
    public class WardPickupRequestResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string RequestId { get; set; } = string.Empty;
        public string CitizenId { get; set; } = string.Empty;
        public string WardId { get; set; } = string.Empty;
        public List<WasteItem> WasteItems { get; set; } = new();
        public string OverallCategory { get; set; } = "Recyclable Plastic";
        public bool AIAnalyzed { get; set; }
        public double AIConfidence { get; set; }
        public string SegregationAdvice { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string? AcceptedByWorkerId { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? CollectionDate { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? CollectedAt { get; set; }

        // Dynamic Citizen details fetched from Citizen collection
        public string CitizenName { get; set; } = string.Empty;
        public string HouseName { get; set; } = string.Empty;
        public string HouseNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
    }
}