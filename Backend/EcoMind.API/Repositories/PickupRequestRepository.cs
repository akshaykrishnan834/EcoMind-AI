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
            return await _requests
                .Find(x => x.CitizenId == citizenId)
                .SortByDescending(x => x.RequestedAt)
                .ToListAsync();
        }

        public async Task<PickupRequest?> GetCurrentMonthRequestByCitizenIdAsync(
            string citizenId)
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            return await _requests
                .Find(x => x.CitizenId == citizenId &&
                           x.RequestedAt >= startOfMonth &&
                           x.RequestedAt < endOfMonth &&
                           x.Status != "Cancelled")
                .SortByDescending(x => x.RequestedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<List<PickupRequest>> GetWardRequestsAsync(
            string wardId)
        {
            return await _requests
                .Find(x => x.WardId == wardId)
                .SortByDescending(x => x.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<PickupRequest>> GetPendingByWardAsync(
            string wardId)
        {
            return await _requests
                .Find(x => x.WardId == wardId && x.Status == "Pending")
                .SortBy(x => x.RequestedAt)
                .ToListAsync();
        }

        public async Task<PickupRequest?> GetByRequestIdAsync(
            string requestId)
        {
            return await _requests
                .Find(x => x.RequestId == requestId)
                .FirstOrDefaultAsync();
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