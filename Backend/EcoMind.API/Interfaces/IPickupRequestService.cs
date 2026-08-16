using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IPickupRequestService
    {
        Task<PickupRequest?> CreateAsync(
            CreatePickupRequestDto dto);

        Task<List<WardPickupRequestResponseDto>> GetAllRequestsAsync();

        Task<PickupRequest?> GetCurrentMonthRequestAsync(
            string citizenId);

        Task<List<PickupRequest>> GetCitizenRequestsAsync(
            string citizenId);

        Task<List<WardPickupRequestResponseDto>> GetWardRequestsAsync(
            string wardId);

        Task<bool> ScheduleRequestAsync(
            string requestId,
            string workerId,
            DateTime collectionDate);

        Task<bool> CompleteRequestAsync(
            string requestId,
            string? workerId = null);

        Task<bool> UpdateStatusAsync(
            string requestId,
            string status);
    }
}