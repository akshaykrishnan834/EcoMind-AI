namespace EcoMind.API.DTOs
{
    public class CreatePickupRequestDto
    {
        public string CitizenId { get; set; } = string.Empty;

        // Allowed values: "Small", "Medium", "Large"
        public string EstimatedVolume { get; set; } = "Medium";

        public string OverallCategory { get; set; } = "Recyclable Plastic";
        public bool AIAnalyzed { get; set; } = false;
        public double AIConfidence { get; set; } = 0;
        public string SegregationAdvice { get; set; } = string.Empty;
        public DateTime? RequestedAt { get; set; }
    }

    public class SchedulePickupRequestDto
    {
        public string WorkerId { get; set; } = string.Empty;

        public DateTime? CollectionDate { get; set; }

        public DateTime? ScheduledDate { get; set; }
    }

    public class CompletePickupRequestDto
    {
        public string? WorkerId { get; set; }
        public string VerificationCode { get; set; } = string.Empty;
    }

    public class SubmitDueReasonDto
    {
        public string Reason { get; set; } = string.Empty;
        public string? SubmittedBy { get; set; }
    }

    // Response DTO for Ward Worker & Admin view
    public class WardPickupRequestResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string RequestId { get; set; } = string.Empty;
        public string CitizenId { get; set; } = string.Empty;
        public string WardId { get; set; } = string.Empty;
        public string EstimatedVolume { get; set; } = "Medium";
        public string OverallCategory { get; set; } = "Recyclable Plastic";
        public string Status { get; set; } = "Pending";
        public string? AcceptedByWorkerId { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? CollectionDate { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string? DueStatus { get; set; }
        public string? DueReason { get; set; }
        public DateTime? DueReasonSubmittedAt { get; set; }
        public string? DueReasonSubmittedBy { get; set; }
        public string? CitizenApprovalStatus { get; set; }
        public DateTime? CitizenApprovedAt { get; set; }
        public string? AdminApprovalStatus { get; set; }
        public DateTime? AdminApprovedAt { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? CollectedAt { get; set; }
        public int? CollectionMonth { get; set; }
        public int? CollectionYear { get; set; }
        public string? CollectionPeriodName { get; set; }

        public bool AIAnalyzed { get; set; } = false;
        public double AIConfidence { get; set; } = 0;
        public string SegregationAdvice { get; set; } = string.Empty;
        public string VerificationCode { get; set; } = string.Empty;

        // Dynamic Citizen details fetched from Citizen collection
        public string CitizenName { get; set; } = string.Empty;
        public string HouseName { get; set; } = string.Empty;
        public string HouseNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class ApproveDueReasonDto
    {
        public string ApprovedBy { get; set; } = "Citizen"; // "Citizen" or "Admin"
        public string Action { get; set; } = "Approve"; // "Approve" or "Reject"
    }
}