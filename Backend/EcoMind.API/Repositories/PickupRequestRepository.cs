using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class PickupRequestRepository : IPickupRequestRepository
    {
        private readonly IMongoCollection<PickupRequest> _requests;

        public PickupRequestRepository(MongoDbService mongoDbService)
        {
            _requests = mongoDbService.Database
                .GetCollection<PickupRequest>("PickupRequests");
        }

        public async Task CreateAsync(PickupRequest request)
        {
            await _requests.InsertOneAsync(request);
        }

        public async Task<List<PickupRequest>> GetAllAsync()
        {
            return await _requests
                .Find(_ => true)
                .SortByDescending(x => x.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<PickupRequest>> GetByCitizenIdAsync(
            string citizenId)
        {
            var list = await _requests
                .Find(x => x.CitizenId == citizenId)
                .SortByDescending(x => x.RequestedAt)
                .ToListAsync();

            foreach (var req in list)
            {
                if (string.IsNullOrWhiteSpace(req.VerificationCode) && req.Status != "Cancelled")
                {
                    req.VerificationCode = Random.Shared.Next(1000, 10000).ToString();
                    await _requests.UpdateOneAsync(
                        x => x.RequestId == req.RequestId,
                        Builders<PickupRequest>.Update.Set(x => x.VerificationCode, req.VerificationCode));
                }
            }

            return list;
        }

        public async Task<PickupRequest?> GetCurrentMonthRequestByCitizenIdAsync(
            string citizenId)
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            var req = await _requests
                .Find(x => x.CitizenId == citizenId &&
                           x.RequestedAt >= startOfMonth &&
                           x.RequestedAt < endOfMonth &&
                           x.Status != "Cancelled")
                .SortByDescending(x => x.RequestedAt)
                .FirstOrDefaultAsync();

            if (req != null && string.IsNullOrWhiteSpace(req.VerificationCode))
            {
                req.VerificationCode = Random.Shared.Next(1000, 10000).ToString();
                await _requests.UpdateOneAsync(
                    x => x.RequestId == req.RequestId,
                    Builders<PickupRequest>.Update.Set(x => x.VerificationCode, req.VerificationCode));
            }

            return req;
        }

        public async Task<List<PickupRequest>> GetWardRequestsAsync(
            string wardId,
            string? workerEmail = null,
            string? workerCode = null)
        {
            if (string.IsNullOrWhiteSpace(wardId)) return new List<PickupRequest>();
            var cleanWard = wardId.Trim();
            var wardFilter = Builders<PickupRequest>.Filter.Regex(
                x => x.WardId,
                new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanWard)}$", "i"));

            FilterDefinition<PickupRequest> finalFilter = wardFilter;

            if (!string.IsNullOrWhiteSpace(workerEmail) || !string.IsNullOrWhiteSpace(workerCode))
            {
                var cleanEmail = (workerEmail ?? "").Trim();
                var cleanCode = (workerCode ?? "").Trim();

                var workerFilters = new List<FilterDefinition<PickupRequest>>();

                if (!string.IsNullOrWhiteSpace(cleanEmail))
                {
                    workerFilters.Add(Builders<PickupRequest>.Filter.Regex(
                        x => x.AcceptedByWorkerId,
                        new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanEmail)}$", "i")));
                }
                if (!string.IsNullOrWhiteSpace(cleanCode))
                {
                    workerFilters.Add(Builders<PickupRequest>.Filter.Regex(
                        x => x.AcceptedByWorkerId,
                        new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanCode)}$", "i")));
                }

                // Also include pending requests in this ward that are not yet assigned to another worker
                var pendingFilter = Builders<PickupRequest>.Filter.And(
                    Builders<PickupRequest>.Filter.Regex(x => x.Status, new MongoDB.Bson.BsonRegularExpression("^Pending$", "i")),
                    Builders<PickupRequest>.Filter.Or(
                        Builders<PickupRequest>.Filter.Eq(x => x.AcceptedByWorkerId, null),
                        Builders<PickupRequest>.Filter.Eq(x => x.AcceptedByWorkerId, ""),
                        Builders<PickupRequest>.Filter.Or(workerFilters)
                    )
                );

                var assignedToWorkerFilter = Builders<PickupRequest>.Filter.Or(workerFilters);
                var combinedWorkerFilter = Builders<PickupRequest>.Filter.Or(assignedToWorkerFilter, pendingFilter);
                finalFilter = Builders<PickupRequest>.Filter.And(wardFilter, combinedWorkerFilter);
            }

            return await _requests
                .Find(finalFilter)
                .SortByDescending(x => x.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<PickupRequest>> GetWorkerRequestsAsync(
            string workerEmail,
            string workerCode,
            string? wardId = null)
        {
            var cleanEmail = (workerEmail ?? "").Trim();
            var cleanCode = (workerCode ?? "").Trim();

            var workerFilters = new List<FilterDefinition<PickupRequest>>();

            if (!string.IsNullOrWhiteSpace(cleanEmail))
            {
                workerFilters.Add(Builders<PickupRequest>.Filter.Regex(
                    x => x.AcceptedByWorkerId,
                    new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanEmail)}$", "i")));
            }
            if (!string.IsNullOrWhiteSpace(cleanCode))
            {
                workerFilters.Add(Builders<PickupRequest>.Filter.Regex(
                    x => x.AcceptedByWorkerId,
                    new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanCode)}$", "i")));
            }

            FilterDefinition<PickupRequest> finalFilter;

            if (!string.IsNullOrWhiteSpace(wardId))
            {
                var cleanWard = wardId.Trim();
                var wardFilter = Builders<PickupRequest>.Filter.Regex(
                    x => x.WardId,
                    new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanWard)}$", "i"));

                var pendingFilter = Builders<PickupRequest>.Filter.And(
                    wardFilter,
                    Builders<PickupRequest>.Filter.Regex(x => x.Status, new MongoDB.Bson.BsonRegularExpression("^Pending$", "i")),
                    Builders<PickupRequest>.Filter.Or(
                        Builders<PickupRequest>.Filter.Eq(x => x.AcceptedByWorkerId, null),
                        Builders<PickupRequest>.Filter.Eq(x => x.AcceptedByWorkerId, ""),
                        Builders<PickupRequest>.Filter.Or(workerFilters)
                    )
                );

                var assignedFilter = workerFilters.Count > 0
                    ? Builders<PickupRequest>.Filter.Or(workerFilters)
                    : Builders<PickupRequest>.Filter.Empty;

                finalFilter = Builders<PickupRequest>.Filter.Or(assignedFilter, pendingFilter);
            }
            else
            {
                finalFilter = workerFilters.Count > 0
                    ? Builders<PickupRequest>.Filter.Or(workerFilters)
                    : Builders<PickupRequest>.Filter.Empty;
            }

            return await _requests
                .Find(finalFilter)
                .SortByDescending(x => x.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<PickupRequest>> GetPendingByWardAsync(
            string wardId)
        {
            if (string.IsNullOrWhiteSpace(wardId)) return new List<PickupRequest>();
            var cleanWard = wardId.Trim();
            var wardFilter = Builders<PickupRequest>.Filter.Regex(
                x => x.WardId,
                new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(cleanWard)}$", "i"));
            var statusFilter = Builders<PickupRequest>.Filter.Regex(
                x => x.Status,
                new MongoDB.Bson.BsonRegularExpression("^Pending$", "i"));

            return await _requests
                .Find(Builders<PickupRequest>.Filter.And(wardFilter, statusFilter))
                .SortBy(x => x.RequestedAt)
                .ToListAsync();
        }

        public async Task<PickupRequest?> GetByRequestIdAsync(
            string requestId)
        {
            if (string.IsNullOrWhiteSpace(requestId)) return null;
            var clean = requestId.Trim();

            FilterDefinition<PickupRequest> filter;
            if (MongoDB.Bson.ObjectId.TryParse(clean, out _))
            {
                filter = Builders<PickupRequest>.Filter.Or(
                    Builders<PickupRequest>.Filter.Regex(x => x.RequestId, new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(clean)}$", "i")),
                    Builders<PickupRequest>.Filter.Eq(x => x.Id, clean)
                );
            }
            else
            {
                filter = Builders<PickupRequest>.Filter.Regex(
                    x => x.RequestId,
                    new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(clean)}$", "i"));
            }

            var req = await _requests
                .Find(filter)
                .FirstOrDefaultAsync();

            if (req != null && string.IsNullOrWhiteSpace(req.VerificationCode))
            {
                req.VerificationCode = Random.Shared.Next(1000, 10000).ToString();
                await _requests.UpdateOneAsync(
                    x => x.RequestId == req.RequestId,
                    Builders<PickupRequest>.Update.Set(x => x.VerificationCode, req.VerificationCode));
            }

            return req;
        }

        public async Task<bool> ScheduleRequestAsync(
            string requestId,
            string workerId,
            DateTime collectionDate)
        {
            var update = Builders<PickupRequest>
                .Update
                .Set(x => x.Status, "Scheduled")
                .Set(x => x.AcceptedByWorkerId, workerId)
                .Set(x => x.AcceptedAt, DateTime.UtcNow)
                .Set(x => x.CollectionDate, collectionDate);

            var result = await _requests.UpdateOneAsync(
                x => x.RequestId == requestId,
                update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> CompleteRequestAsync(
            string requestId)
        {
            var update = Builders<PickupRequest>
                .Update
                .Set(x => x.Status, "Completed")
                .Set(x => x.CollectedAt, DateTime.UtcNow);

            var result = await _requests.UpdateOneAsync(
                x => x.RequestId == requestId,
                update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> VerificationCodeExistsAsync(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return false;

            return await _requests
                .Find(x => x.VerificationCode == code && x.Status != "Completed" && x.Status != "Collected" && x.Status != "Cancelled")
                .AnyAsync();
        }

        public async Task<bool> UpdateStatusAsync(
            string requestId,
            string status)
        {
            var update = Builders<PickupRequest>
                .Update
                .Set(x => x.Status, status);

            if (status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
                status.Equals("Collected", StringComparison.OrdinalIgnoreCase))
            {
                update = update.Set(x => x.CollectedAt, DateTime.UtcNow);
            }

            var result = await _requests.UpdateOneAsync(
                x => x.RequestId == requestId,
                update);

            return result.ModifiedCount > 0;
        }
    }
}