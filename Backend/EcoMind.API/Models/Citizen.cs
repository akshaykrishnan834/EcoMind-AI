using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
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

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}