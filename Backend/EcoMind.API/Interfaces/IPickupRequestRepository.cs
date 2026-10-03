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

        Task<PickupRequest?> GetRequestByCitizenAndPeriodAsync(
            string citizenId,
            int year,
            int month);

        Task<List<PickupRequest>> GetWardRequestsAsync(
            string wardId,
            string? workerEmail = null,
            string? workerCode = null);

        Task<List<PickupRequest>> GetWorkerRequestsAsync(
            string workerEmail,
            string workerCode,
            string? wardId = null);

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

        Task<bool> VerificationCodeExistsAsync(
            string code);

        Task<bool> SubmitDueReasonAsync(
            string requestId,
            string reason,
            string? submittedBy = null);

        Task<bool> ApproveDueReasonAsync(
            string requestId,
            string approvedByRole,
            string action = "Approve");

        Task<bool> UpdateDueStatusAsync(
            string requestId,
            string dueStatus);

        Task<bool> UpdateStatusAsync(
            string requestId,
            string status);
    }
}