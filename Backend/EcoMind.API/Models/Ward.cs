using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EcoMind.API.Models
{
    public class Ward
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string WardId { get; set; } = string.Empty;

        public string WardName { get; set; } = string.Empty;

        // NEW FIELD
        public string PanchayatName { get; set; } = string.Empty;

        public string Status { get; set; } = "Active";
    }
}