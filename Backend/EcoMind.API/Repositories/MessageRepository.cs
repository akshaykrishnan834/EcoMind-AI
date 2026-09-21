using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly IMongoCollection<Message> _messages;

        public MessageRepository(MongoDbService mongoDbService)
        {
            _messages = mongoDbService.Database
                .GetCollection<Message>("Messages");
        }

        public async Task<Message> CreateMessageAsync(
            Message message)
        {
            await _messages.InsertOneAsync(message);

            return message;
        }

        public async Task<List<Message>>
            GetMessagesByPickupRequestAsync(
                string pickupRequestId)
        {
            var clean = (pickupRequestId ?? "").Trim();
            var filter = Builders<Message>.Filter.Regex(
                x => x.PickupRequestId,
                new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(clean)}$", "i"));

            return await _messages
                .Find(filter)
                .SortBy(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task MarkMessagesAsReadAsync(
            string pickupRequestId,
            string userId)
        {
            var cleanReq = (pickupRequestId ?? "").Trim();
            var cleanUser = (userId ?? "").Trim();

            var reqFilter = Builders<Message>.Filter.Regex(
                x => x.PickupRequestId,
                new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanReq)}$", "i"));

            var unreadFilter = Builders<Message>.Filter.Eq(x => x.IsRead, false);

            FilterDefinition<Message> finalFilter;
            if (!string.IsNullOrEmpty(cleanUser))
            {
                var notSenderFilter = Builders<Message>.Filter.Ne(x => x.SenderId, cleanUser);
                finalFilter = Builders<Message>.Filter.And(reqFilter, notSenderFilter, unreadFilter);
            }
            else
            {
                finalFilter = Builders<Message>.Filter.And(reqFilter, unreadFilter);
            }

            var update = Builders<Message>.Update
                .Set(x => x.IsRead, true);

            await _messages.UpdateManyAsync(
                finalFilter,
                update);
        }

        public async Task<long> GetUnreadCountAsync(
            string userId,
            string userType)
        {
            var filter = Builders<Message>.Filter.And(
                Builders<Message>.Filter.Ne(
                    x => x.SenderId,
                    userId),

                Builders<Message>.Filter.Eq(
                    x => x.IsRead,
                    false)
            );

            return await _messages
                .CountDocumentsAsync(filter);
        }
    }
}