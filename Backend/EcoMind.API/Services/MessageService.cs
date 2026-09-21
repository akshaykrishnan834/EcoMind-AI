using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IPickupRequestRepository _pickupRepository;
        private readonly ICitizenRepository _citizenRepository;
        private readonly IWorkerRepository _workerRepository;

        public MessageService(
            IMessageRepository messageRepository,
            IPickupRequestRepository pickupRepository,
            ICitizenRepository citizenRepository,
            IWorkerRepository workerRepository)
        {
            _messageRepository = messageRepository;
            _pickupRepository = pickupRepository;
            _citizenRepository = citizenRepository;
            _workerRepository = workerRepository;
        }

        public async Task<MessageItem> SendMessageAsync(
            SendMessageRequest request,
            string senderId,
            string senderRole)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
            {
                throw new Exception("Message cannot be empty.");
            }

            string citizenId = (request.CitizenId ?? "").Trim();
            string workerId = (request.WorkerId ?? "").Trim();
            string? pickupRequestId = !string.IsNullOrWhiteSpace(request.PickupRequestId)
                ? request.PickupRequestId.Trim()
                : (!string.IsNullOrWhiteSpace(request.RequestId) ? request.RequestId.Trim() : null);

            // If pickupRequestId provided, use it to resolve citizen/worker if either is missing
            if (!string.IsNullOrWhiteSpace(pickupRequestId) && (string.IsNullOrEmpty(citizenId) || string.IsNullOrEmpty(workerId)))
            {
                var pickup = await _pickupRepository.GetByRequestIdAsync(pickupRequestId);
                if (pickup != null)
                {
                    if (string.IsNullOrEmpty(citizenId)) citizenId = pickup.CitizenId;
                    if (string.IsNullOrEmpty(workerId)) workerId = pickup.AcceptedByWorkerId ?? "";
                    if (string.IsNullOrEmpty(workerId) && string.Equals(senderRole, "Worker", StringComparison.OrdinalIgnoreCase))
                    {
                        workerId = senderId.Trim();
                    }
                }
            }

            // If sender is Worker and citizenId is provided, senderId is workerId
            if (string.Equals(senderRole, "Worker", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrEmpty(workerId)) workerId = senderId.Trim();
            }
            // If sender is Citizen and workerId is provided, senderId is citizenId
            else if (string.Equals(senderRole, "Citizen", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrEmpty(citizenId)) citizenId = senderId.Trim();

                // If workerId is still empty, find worker assigned to citizen's ward
                if (string.IsNullOrEmpty(workerId))
                {
                    var citizen = await ResolveCitizenAsync(citizenId);
                    if (citizen != null && !string.IsNullOrEmpty(citizen.WardId))
                    {
                        var allWorkers = await _workerRepository.GetAllWorkersAsync();
                        var matchedWorker = allWorkers.FirstOrDefault(w =>
                            string.Equals(w.WardId, citizen.WardId, StringComparison.OrdinalIgnoreCase));
                        if (matchedWorker != null)
                        {
                            workerId = !string.IsNullOrEmpty(matchedWorker.Email) ? matchedWorker.Email : matchedWorker.WorkerId;
                        }
                    }
                }
            }

            if (string.IsNullOrEmpty(citizenId))
            {
                throw new Exception("Citizen ID is required for conversation.");
            }

            if (string.IsNullOrEmpty(workerId))
            {
                // Fallback: assign to default ward worker if available
                var allWorkers = await _workerRepository.GetAllWorkersAsync();
                var fallbackWorker = allWorkers.FirstOrDefault();
                if (fallbackWorker != null)
                {
                    workerId = !string.IsNullOrEmpty(fallbackWorker.Email) ? fallbackWorker.Email : fallbackWorker.WorkerId;
                }
                else
                {
                    throw new Exception("No worker is assigned for this citizen.");
                }
            }

            // Get or create persistent conversation
            var conversation = await GetOrCreateConversationAsync(citizenId, workerId);

            var isSentByCitizen = string.Equals(senderRole, "Citizen", StringComparison.OrdinalIgnoreCase);

            var messageItem = new MessageItem
            {
                MessageId = "MSG" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                SenderId = senderId.Trim(),
                SenderType = isSentByCitizen ? "Citizen" : "Worker",
                Text = request.Text.Trim(),
                PickupRequestId = pickupRequestId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _messageRepository.AddMessageToConversationAsync(
                conversation.ConversationId,
                messageItem,
                isSentByCitizen);

            return messageItem;
        }

        public async Task<Conversation> GetOrCreateConversationAsync(
            string citizenId,
            string workerId)
        {
            var existing = await _messageRepository.GetConversationAsync(citizenId, workerId);
            if (existing != null)
            {
                return existing;
            }

            // Resolve full metadata from Citizen and Worker collections
            var citizen = await ResolveCitizenAsync(citizenId);
            var worker = await ResolveWorkerAsync(workerId);

            var newConv = new Conversation
            {
                ConversationId = "CONV_" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper(),
                CitizenId = citizen?.CitizenId ?? citizenId,
                CitizenEmail = citizen?.Email ?? (citizenId.Contains("@") ? citizenId : ""),
                CitizenName = citizen?.FullName ?? "Citizen",
                CitizenPhone = citizen?.PhoneNumber ?? "",
                HouseNumber = citizen?.HouseNumber ?? "",
                HouseName = citizen?.HouseName ?? "",
                WardId = citizen?.WardId ?? worker?.WardId ?? "",
                WorkerId = worker?.WorkerId ?? worker?.Email ?? workerId,
                WorkerEmail = worker?.Email ?? (workerId.Contains("@") ? workerId : ""),
                WorkerName = worker?.FullName ?? "Haritha Karma Sena Worker",
                WorkerPhone = worker?.PhoneNumber ?? "",
                Messages = new List<MessageItem>(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return await _messageRepository.CreateConversationAsync(newConv);
        }

        public async Task<Conversation?> GetConversationByIdAsync(
            string conversationId)
        {
            return await _messageRepository.GetConversationByIdAsync(conversationId);
        }

        public async Task<List<ConversationSummaryDto>> GetWorkerConversationsAsync(
            string workerId)
        {
            if (string.IsNullOrWhiteSpace(workerId)) return new List<ConversationSummaryDto>();

            var worker = await ResolveWorkerAsync(workerId);
            var effectiveWorkerId = worker?.WorkerId ?? workerId;
            var effectiveWorkerEmail = worker?.Email ?? workerId;

            // Fetch all conversations where worker matches
            var convs = await _messageRepository.GetConversationsByWorkerAsync(workerId);

            // Also fetch all verified citizens in worker's ward to populate conversations if not started yet
            var workerWard = worker?.WardId ?? "";
            var wardCitizens = new List<Citizen>();
            if (!string.IsNullOrWhiteSpace(workerWard))
            {
                var citizens = await _citizenRepository.GetCitizensByWardAsync(workerWard);
                wardCitizens = citizens.Where(c => c.IsVerified || c.Status == "Verified").ToList();
            }

            // Map existing conversations to dictionary
            var existingMap = new Dictionary<string, Conversation>(StringComparer.OrdinalIgnoreCase);
            foreach (var c in convs)
            {
                if (!string.IsNullOrEmpty(c.CitizenId)) existingMap[c.CitizenId] = c;
                if (!string.IsNullOrEmpty(c.CitizenEmail)) existingMap[c.CitizenEmail] = c;
            }

            var result = new List<ConversationSummaryDto>();

            // 1. Add all active conversations
            foreach (var conv in convs)
            {
                var summary = new ConversationSummaryDto
                {
                    ConversationId = conv.ConversationId,
                    CitizenId = conv.CitizenId,
                    WorkerId = conv.WorkerId,
                    CitizenName = conv.CitizenName,
                    HouseNumber = conv.HouseNumber,
                    HouseName = conv.HouseName,
                    CitizenPhone = conv.CitizenPhone,
                    WardId = conv.WardId,
                    WorkerName = conv.WorkerName,
                    WorkerPhone = conv.WorkerPhone,
                    LastMessageText = conv.LastMessageText,
                    LastMessageAt = conv.LastMessageAt,
                    LastSenderRole = conv.LastSenderRole,
                    UnreadCount = conv.UnreadCountWorker
                };

                // Check active pickup request for this citizen
                if (!string.IsNullOrEmpty(conv.CitizenId))
                {
                    var reqs = await _pickupRepository.GetByCitizenIdAsync(conv.CitizenId);
                    var activeReq = reqs.FirstOrDefault(r => r.Status == "Pending" || r.Status == "Scheduled");
                    if (activeReq != null)
                    {
                        summary.ActivePickupRequestId = activeReq.RequestId;
                        summary.ActivePickupStatus = activeReq.Status;
                    }
                }

                result.Add(summary);
            }

            // 2. Include any assigned ward citizens who haven't started chatting yet
            foreach (var cit in wardCitizens)
            {
                var citKey = cit.CitizenId ?? cit.Email ?? "";
                if (string.IsNullOrEmpty(citKey)) continue;

                if (!existingMap.ContainsKey(cit.CitizenId ?? "") && !existingMap.ContainsKey(cit.Email ?? ""))
                {
                    var summary = new ConversationSummaryDto
                    {
                        ConversationId = "",
                        CitizenId = cit.CitizenId ?? cit.Email ?? "",
                        WorkerId = effectiveWorkerEmail,
                        CitizenName = cit.FullName,
                        HouseNumber = cit.HouseNumber,
                        HouseName = cit.HouseName,
                        CitizenPhone = cit.PhoneNumber,
                        WardId = cit.WardId,
                        WorkerName = worker?.FullName ?? "Worker",
                        WorkerPhone = worker?.PhoneNumber ?? "",
                        LastMessageText = "No messages yet",
                        LastMessageAt = null,
                        LastSenderRole = "",
                        UnreadCount = 0
                    };

                    result.Add(summary);
                }
            }

            return result.OrderByDescending(x => x.UnreadCount > 0)
                         .ThenByDescending(x => x.LastMessageAt ?? DateTime.MinValue)
                         .ToList();
        }

        public async Task<Conversation?> GetCitizenConversationAsync(
            string citizenId,
            string? workerId = null)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return null;

            // If workerId provided, get or create directly
            if (!string.IsNullOrWhiteSpace(workerId))
            {
                return await GetOrCreateConversationAsync(citizenId, workerId);
            }

            // Check if citizen already has a conversation
            var convs = await _messageRepository.GetConversationsByCitizenAsync(citizenId);
            if (convs.Count > 0)
            {
                return convs.First();
            }

            // Resolve assigned worker by citizen's ward
            var citizen = await ResolveCitizenAsync(citizenId);
            if (citizen != null && !string.IsNullOrWhiteSpace(citizen.WardId))
            {
                var allWorkers = await _workerRepository.GetAllWorkersAsync();
                var matchedWorker = allWorkers.FirstOrDefault(w =>
                    string.Equals(w.WardId, citizen.WardId, StringComparison.OrdinalIgnoreCase));

                var assignedWorkerId = matchedWorker?.Email ?? matchedWorker?.WorkerId;
                if (!string.IsNullOrEmpty(assignedWorkerId))
                {
                    return await GetOrCreateConversationAsync(citizenId, assignedWorkerId);
                }
            }

            // Fallback: assign to first available worker
            var workers = await _workerRepository.GetAllWorkersAsync();
            var fallback = workers.FirstOrDefault();
            if (fallback != null)
            {
                var fbId = !string.IsNullOrEmpty(fallback.Email) ? fallback.Email : fallback.WorkerId;
                return await GetOrCreateConversationAsync(citizenId, fbId);
            }

            return null;
        }

        public async Task<Conversation?> GetConversationByPickupRequestIdAsync(
            string pickupRequestId)
        {
            if (string.IsNullOrWhiteSpace(pickupRequestId)) return null;

            var pickup = await _pickupRepository.GetByRequestIdAsync(pickupRequestId.Trim());
            if (pickup == null) return null;

            var citizenId = pickup.CitizenId;
            var workerId = pickup.AcceptedByWorkerId;

            if (string.IsNullOrEmpty(workerId))
            {
                var allWorkers = await _workerRepository.GetAllWorkersAsync();
                var matched = allWorkers.FirstOrDefault(w =>
                    string.Equals(w.WardId, pickup.WardId, StringComparison.OrdinalIgnoreCase));
                workerId = matched?.Email ?? matched?.WorkerId ?? "Worker";
            }

            return await GetOrCreateConversationAsync(citizenId, workerId);
        }

        public async Task MarkAsReadAsync(
            string conversationId,
            string userId,
            string userRole)
        {
            await _messageRepository.MarkConversationReadAsync(conversationId, userRole);
        }

        public async Task<long> GetUnreadCountAsync(
            string userId,
            string userRole)
        {
            return await _messageRepository.GetUnreadCountAsync(userId, userRole);
        }

        private async Task<Citizen?> ResolveCitizenAsync(string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId)) return null;
            var clean = citizenId.Trim();

            var cit = await _citizenRepository.GetCitizenByCitizenIdAsync(clean);
            if (cit != null) return cit;

            if (clean.Contains("@"))
            {
                cit = await _citizenRepository.GetCitizenByEmailAsync(clean);
                if (cit != null) return cit;
            }

            var all = await _citizenRepository.GetAllCitizensAsync();
            return all.FirstOrDefault(c =>
                string.Equals(c.CitizenId, clean, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(c.Email, clean, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(c.Id, clean, StringComparison.OrdinalIgnoreCase));
        }

        private async Task<Worker?> ResolveWorkerAsync(string workerId)
        {
            if (string.IsNullOrWhiteSpace(workerId)) return null;
            var clean = workerId.Trim();

            if (clean.Contains("@"))
            {
                var w = await _workerRepository.GetWorkerByEmailAsync(clean);
                if (w != null) return w;
            }

            var all = await _workerRepository.GetAllWorkersAsync();
            return all.FirstOrDefault(w =>
                string.Equals(w.WorkerId, clean, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(w.Email, clean, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(w.Id, clean, StringComparison.OrdinalIgnoreCase));
        }
    }
}