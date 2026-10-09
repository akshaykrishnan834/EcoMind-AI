using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    [BsonIgnoreExtraElements]
    public class Citizen
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string CitizenId { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public string HouseName { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string HouseNumber { get; set; } = string.Empty;

        public string WardId { get; set; } = string.Empty;

        public string PanchayatName { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public string Status { get; set; } = "Pending";

        public bool ProfileCompleted { get; set; } = false;

        public bool IsVerified { get; set; } = false;

        public DateTime? VerifiedAt { get; set; }

        public string VerifiedBy { get; set; } = string.Empty;

        [BsonDefaultValue(17)]
        public int EcoPoints { get; set; } = 17;

        public List<EcoPointEntry> PointEntries { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [BsonIgnoreExtraElements]
    public class EcoPointEntry
    {
        public int Points { get; set; } = 2;

        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMonths(4);

        public string RequestId { get; set; } = string.Empty;

        public bool IsUsed { get; set; } = false;

        public string Description { get; set; } = "Doorstep plastic collection (+2 Pts, 4 Months Validity)";
    }
}