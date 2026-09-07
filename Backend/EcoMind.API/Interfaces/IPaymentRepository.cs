using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IPaymentRepository
    {
        Task CreateAsync(Payment payment);
        Task UpdateAsync(Payment payment);
        Task<Payment?> GetByCitizenAndPeriodAsync(string citizenId, int year, int month);
        Task<List<Payment>> GetByCitizenIdAsync(string citizenId);
        Task<List<Payment>> GetAllAsync();
    }
}
