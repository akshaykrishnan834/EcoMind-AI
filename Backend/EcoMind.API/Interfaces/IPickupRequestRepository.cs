using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IPickupRequestRepository
    {
        Task CreateAsync(PickupRequest request);

        Task<List<PickupRequest>> GetAllAsync();

        Task<List<PickupRequest>> GetByCitizenIdAsync(
            string citizenId);

        Task<PickupRequest?> GetCurrentMonthRequestByCitizenIdAsync(
            string citizenId);

        Task<List<PickupRequest>> GetWardRequestsAsync(
            string wardId);

        Task<List<PickupRequest>> GetPendingByWardAsync(
            string wardId);

        Task<PickupRequest?> GetByRequestIdAsync(
            string requestId);

        Task<bool> ScheduleRequestAsync(
            string requestId,
            string workerId,
            DateTime collectionDate);

        Task<bool> CompleteRequestAsync(
            string requestId);

        Task<bool> UpdateStatusAsync(
            string requestId,
            string status);
    }
}