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

        public async Task<PickupRequest?> GetRequestByCitizenAndPeriodAsync(
            string citizenId,
            int year,
            int month)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return null;
            var cleanCitizen = citizenId.Trim();

            var list = await _requests
                .Find(x => (x.CitizenId == cleanCitizen || x.CitizenId == citizenId) &&
                           x.Status != "Cancelled")
                .SortByDescending(x => x.RequestedAt)
                .ToListAsync();

            foreach (var r in list)
            {
                if (r.CollectionYear == year && r.CollectionMonth == month)
                {
                    return r;
                }

                // If not explicitly set, calculate from RequestedAt
                if (!r.CollectionYear.HasValue || !r.CollectionMonth.HasValue)
                {
                    var reqDate = r.RequestedAt != default ? r.RequestedAt : DateTime.UtcNow;
                    var (compYear, compMonth, _) = PickupRequestService.CalculateAssignedCollectionPeriod(reqDate);

                    if (compYear == year && compMonth == month)
                    {
                        return r;
                    }
                }
            }

            return null;
        }

        public async Task<PickupRequest?> GetCurrentMonthRequestByCitizenIdAsync(
            string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return null;
            var cleanCitizen = citizenId.Trim();

            // 1. Prioritize any active, due, or uncompleted pickup request for this citizen
            var activeReq = await _requests
                .Find(x => (x.CitizenId == cleanCitizen || x.CitizenId == citizenId) &&
                           x.Status != "Cancelled" &&
                           x.Status != "Completed" &&
                           x.Status != "Collected")
                .SortByDescending(x => x.RequestedAt)
                .FirstOrDefaultAsync();

            if (activeReq != null)
            {
                if (string.IsNullOrWhiteSpace(activeReq.VerificationCode))
                {
                    activeReq.VerificationCode = Random.Shared.Next(1000, 10000).ToString();
                    await _requests.UpdateOneAsync(
                        x => x.Id == activeReq.Id || x.RequestId == activeReq.RequestId,
                        Builders<PickupRequest>.Update.Set(x => x.VerificationCode, activeReq.VerificationCode));
                }
                return activeReq;
            }

            // 2. Determine target collection period for current date (<= 25: current month; > 25: next month)
            var (targetYear, targetMonth, _) = PickupRequestService.CalculateAssignedCollectionPeriod(DateTime.UtcNow);

            var req = await GetRequestByCitizenAndPeriodAsync(cleanCitizen, targetYear, targetMonth);

            if (req != null && string.IsNullOrWhiteSpace(req.VerificationCode))
            {
                req.VerificationCode = Random.Shared.Next(1000, 10000).ToString();
                await _requests.UpdateOneAsync(
                    x => x.Id == req.Id || x.RequestId == req.RequestId,
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
                .Set(x => x.CollectionDate, collectionDate)
                .Set(x => x.ScheduledDate, collectionDate)
                .Set(x => x.DueStatus, null)
                .Set(x => x.DueReason, null)
                .Set(x => x.DueReasonSubmittedAt, null)
                .Set(x => x.DueReasonSubmittedBy, null)
                .Set(x => x.CitizenApprovalStatus, null)
                .Set(x => x.CitizenApprovedAt, null)
                .Set(x => x.AdminApprovalStatus, null)
                .Set(x => x.AdminApprovedAt, null);

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
                .Set(x => x.DueStatus, null)
                .Set(x => x.CollectedAt, DateTime.UtcNow);

            var result = await _requests.UpdateOneAsync(
                x => x.RequestId == requestId,
                update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> SubmitDueReasonAsync(
            string requestId,
            string reason,
            string? submittedBy = null)
        {
            var req = await GetByRequestIdAsync(requestId);
            if (req == null) return false;

            var cleanReason = reason.Trim();
            var submitter = string.IsNullOrWhiteSpace(submittedBy) ? "Worker" : submittedBy.Trim();

            var update = Builders<PickupRequest>
                .Update
                .Set(x => x.DueReason, cleanReason)
                .Set(x => x.DueReasonSubmittedAt, DateTime.UtcNow)
                .Set(x => x.DueReasonSubmittedBy, submitter)
                .Set(x => x.DueStatus, "Review Required")
                .Set(x => x.AdminApprovalStatus, "Pending")
                .Set(x => x.AdminApprovedAt, null)
                .Set(x => x.Status, "Due / Review Required");

            var result = await _requests.UpdateOneAsync(
                x => x.Id == req.Id || x.RequestId == req.RequestId,
                update);

            return result.ModifiedCount > 0 || result.MatchedCount > 0;
        }

        public async Task<bool> ApproveDueReasonAsync(
            string requestId,
            string approvedByRole,
            string action = "Approve")
        {
            var req = await GetByRequestIdAsync(requestId);
            if (req == null) return false;

            var isApproved = action.Equals("Approve", StringComparison.OrdinalIgnoreCase);
            var normalizedAction = isApproved ? "Approved" : "Rejected";
            var newDueStatus = isApproved ? "Approved for Reschedule" : "Rejected";
            var now = DateTime.UtcNow;

            var updateBuilder = Builders<PickupRequest>.Update
                .Set(x => x.DueStatus, newDueStatus)
                .Set(x => x.AdminApprovalStatus, normalizedAction)
                .Set(x => x.AdminApprovedAt, now)
                .Set(x => x.Status, "Due / Review Required");

            var result = await _requests.UpdateOneAsync(
                x => x.Id == req.Id || x.RequestId == req.RequestId,
                updateBuilder);

            return result.ModifiedCount > 0 || result.MatchedCount > 0;
        }

        public async Task<bool> UpdateDueStatusAsync(
            string requestId,
            string dueStatus)
        {
            if (string.IsNullOrWhiteSpace(requestId)) return false;
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

            var update = Builders<PickupRequest>
                .Update
                .Set(x => x.DueStatus, dueStatus)
                .Set(x => x.Status, "Due / Review Required");

            var result = await _requests.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0 || result.MatchedCount > 0;
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
                update = update
                    .Set(x => x.CollectedAt, DateTime.UtcNow)
                    .Set(x => x.DueStatus, null);
            }

            var result = await _requests.UpdateOneAsync(
                x => x.RequestId == requestId,
                update);

            return result.ModifiedCount > 0;
        }
    }
}