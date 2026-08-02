using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    public class Panchayat
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string PanchayatId { get; set; } = string.Empty;

        public string PanchayatName { get; set; } = string.Empty;

        public string District { get; set; } = string.Empty;

        public int NumberOfWards { get; set; }

        public string State { get; set; } = "Kerala";

        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}