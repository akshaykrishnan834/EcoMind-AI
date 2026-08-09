using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IWorkerService
    {
        Task<string> CreateWorkerAsync(CreateWorkerDto dto);

        Task<List<Worker>> GetAllWorkersAsync();

        Task<string> UpdateWorkerAsync(UpdateWorkerDto dto);
    }
}