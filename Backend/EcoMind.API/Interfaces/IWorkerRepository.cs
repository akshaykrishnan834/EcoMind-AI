using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IWorkerRepository
    {
        Task CreateWorkerAsync(Worker worker);

        Task<List<Worker>> GetAllWorkersAsync();

        Task<Worker?> GetWorkerByEmailAsync(string email);

        Task<List<Worker>> GetWorkersByWardIdAsync(string wardId);

        Task UpdateWorkerAsync(Worker worker);
    }
}