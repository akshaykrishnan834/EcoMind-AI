using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace EcoMind.API.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly IMongoCollection<Conversation> _conversations;

        public MessageRepository(MongoDbService mongoDbService)
        {
            _conversations = mongoDbService.Database
                .GetCollection<Conversation>("Conversations");
        }

        public async Task<Conversation?> GetConversationAsync(
            string citizenId,
            string workerId)
        {
            if (string.IsNullOrWhiteSpace(citizenId) || string.IsNullOrWhiteSpace(workerId))
            {
                return null;
            }

            var cleanCit = Regex.Escape(citizenId.Trim());
            var cleanWrk = Regex.Escape(workerId.Trim());

            var citFilter = Builders<Conversation>.Filter.Or(
                Builders<Conversation>.Filter.Regex(x => x.CitizenId, new MongoDB.Bson.BsonRegularExpression($"^{cleanCit}$", "i")),
                Builders<Conversation>.Filter.Regex(x => x.CitizenEmail, new MongoDB.Bson.BsonRegularExpression($"^{cleanCit}$", "i"))
            );

            var wrkFilter = Builders<Conversation>.Filter.Or(
                Builders<Conversation>.Filter.Regex(x => x.WorkerId, new MongoDB.Bson.BsonRegularExpression($"^{cleanWrk}$", "i")),
                Builders<Conversation>.Filter.Regex(x => x.WorkerEmail, new MongoDB.Bson.BsonRegularExpression($"^{cleanWrk}$", "i"))
            );

            var filter = Builders<Conversation>.Filter.And(citFilter, wrkFilter);

            return await _conversations
                .Find(filter)
                .FirstOrDefaultAsync();
        }

        private FilterDefinition<Conversation> BuildConversationIdFilter(string conversationId)
        {
            var cleanId = (conversationId ?? "").Trim();
            if (MongoDB.Bson.ObjectId.TryParse(cleanId, out _))
            {
                return Builders<Conversation>.Filter.Or(
                    Builders<Conversation>.Filter.Eq(x => x.ConversationId, cleanId),
                    Builders<Conversation>.Filter.Eq(x => x.Id, cleanId)
                );
            }
            return Builders<Conversation>.Filter.Eq(x => x.ConversationId, cleanId);
        }

        public async Task<Conversation?> GetConversationByIdAsync(
            string conversationId)
        {
            if (string.IsNullOrWhiteSpace(conversationId)) return null;
            var filter = BuildConversationIdFilter(conversationId);
            return await _conversations.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<Conversation> CreateConversationAsync(
            Conversation conversation)
        {
            if (string.IsNullOrWhiteSpace(conversation.ConversationId))
            {
                conversation.ConversationId = "CONV_" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper();
            }

            conversation.CreatedAt = DateTime.UtcNow;
            conversation.UpdatedAt = DateTime.UtcNow;

            await _conversations.InsertOneAsync(conversation);
            return conversation;
        }

        public async Task UpdateConversationAsync(
            Conversation conversation)
        {
            conversation.UpdatedAt = DateTime.UtcNow;
            var filter = BuildConversationIdFilter(conversation.ConversationId);
            await _conversations.ReplaceOneAsync(filter, conversation);
        }

        public async Task<List<Conversation>> GetConversationsByWorkerAsync(
            string workerId)
        {
            if (string.IsNullOrWhiteSpace(workerId)) return new List<Conversation>();

            var cleanWrk = Regex.Escape(workerId.Trim());
            var filter = Builders<Conversation>.Filter.Or(
                Builders<Conversation>.Filter.Regex(x => x.WorkerId, new MongoDB.Bson.BsonRegularExpression($"^{cleanWrk}$", "i")),
                Builders<Conversation>.Filter.Regex(x => x.WorkerEmail, new MongoDB.Bson.BsonRegularExpression($"^{cleanWrk}$", "i"))
            );

            return await _conversations
                .Find(filter)
                .SortByDescending(x => x.UpdatedAt)
                .ToListAsync();
        }

        public async Task<List<Conversation>> GetConversationsByCitizenAsync(
            string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return new List<Conversation>();

            var cleanCit = Regex.Escape(citizenId.Trim());
            var filter = Builders<Conversation>.Filter.Or(
                Builders<Conversation>.Filter.Regex(x => x.CitizenId, new MongoDB.Bson.BsonRegularExpression($"^{cleanCit}$", "i")),
                Builders<Conversation>.Filter.Regex(x => x.CitizenEmail, new MongoDB.Bson.BsonRegularExpression($"^{cleanCit}$", "i"))
            );

            return await _conversations
                .Find(filter)
                .SortByDescending(x => x.UpdatedAt)
                .ToListAsync();
        }

        public async Task AddMessageToConversationAsync(
            string conversationId,
            MessageItem messageItem,
            bool isSentByCitizen)
        {
            var filter = BuildConversationIdFilter(conversationId);

            var update = Builders<Conversation>.Update
                .Push(x => x.Messages, messageItem)
                .Set(x => x.LastMessageText, messageItem.Text)
                .Set(x => x.LastMessageAt, messageItem.CreatedAt)
                .Set(x => x.LastSenderId, messageItem.SenderId)
                .Set(x => x.LastSenderRole, messageItem.SenderType)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            if (isSentByCitizen)
            {
                update = update.Inc(x => x.UnreadCountWorker, 1);
            }
            else
            {
                update = update.Inc(x => x.UnreadCountCitizen, 1);
            }

            await _conversations.UpdateOneAsync(filter, update);
        }

        public async Task MarkConversationReadAsync(
            string conversationId,
            string userRole)
        {
            var isWorker = string.Equals(userRole, "Worker", StringComparison.OrdinalIgnoreCase);
            var filter = BuildConversationIdFilter(conversationId);

            var conv = await _conversations.Find(filter).FirstOrDefaultAsync();
            if (conv == null) return;

            // Mark all messages from the opposite role as read
            var targetSenderType = isWorker ? "Citizen" : "Worker";

            foreach (var msg in conv.Messages)
            {
                if (string.Equals(msg.SenderType, targetSenderType, StringComparison.OrdinalIgnoreCase) && !msg.IsRead)
                {
                    msg.IsRead = true;
                }
            }

            if (isWorker)
            {
                conv.UnreadCountWorker = 0;
            }
            else
            {
                conv.UnreadCountCitizen = 0;
            }

            conv.UpdatedAt = DateTime.UtcNow;

            await _conversations.ReplaceOneAsync(filter, conv);
        }

        public async Task<long> GetUnreadCountAsync(
            string userId,
            string userRole)
        {
            if (string.IsNullOrWhiteSpace(userId)) return 0;
            var isWorker = string.Equals(userRole, "Worker", StringComparison.OrdinalIgnoreCase);

            if (isWorker)
            {
                var convs = await GetConversationsByWorkerAsync(userId);
                return convs.Sum(c => c.UnreadCountWorker);
            }
            else
            {
                var convs = await GetConversationsByCitizenAsync(userId);
                return convs.Sum(c => c.UnreadCountCitizen);
            }
        }
    }
}