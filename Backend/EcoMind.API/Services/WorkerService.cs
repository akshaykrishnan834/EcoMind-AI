using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class WorkerService : IWorkerService
    {
        private readonly IWorkerRepository _workerRepository;

        public WorkerService(IWorkerRepository workerRepository)
        {
            _workerRepository = workerRepository;
        }

        public async Task CreateWorkerAsync(CreateWorkerDto dto)
        {
            var worker = new Worker
            {
                WorkerId = Guid.NewGuid().ToString("N")[..6].ToUpper(),
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                WardId = dto.WardId
            };

            await _workerRepository.CreateWorkerAsync(worker);
        }

        public async Task<List<Worker>> GetAllWorkersAsync()
        {
            return await _workerRepository.GetAllWorkersAsync();
        }
    }
}