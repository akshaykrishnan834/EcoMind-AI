using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IWorkerService
    {
        Task CreateWorkerAsync(CreateWorkerDto dto);

        Task<List<Worker>> GetAllWorkersAsync();
    }
}