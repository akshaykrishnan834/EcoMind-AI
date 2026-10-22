using System;

namespace EcoMind.API.DTOs
{
    public class LiveWorkerTrackingDto
    {
        public string Id { get; set; } = string.Empty;
        public string WorkerId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string WardId { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public string CurrentWardId { get; set; } = string.Empty;
        public bool IsOnDuty { get; set; } = false;
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public DateTime? LastLocationUpdatedAt { get; set; }

        // Scheduled pickup tracking gating
        public bool IsTrackingAllowed { get; set; } = true;
        public string TrackingReason { get; set; } = string.Empty;
        public DateTime? ScheduledDate { get; set; }
        public string? FormattedScheduledDate { get; set; }
        public string? PickupRequestId { get; set; }
        public string? PickupStatus { get; set; }
        public bool IsToday { get; set; } = false;
        public bool IsBeforeScheduledDate { get; set; } = false;
        public bool IsAfterScheduledDate { get; set; } = false;
        public bool IsCancelled { get; set; } = false;
        public bool IsCompleted { get; set; } = false;
        public bool IsRescheduled { get; set; } = false;
    }
}
