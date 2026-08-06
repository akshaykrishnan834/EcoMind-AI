using BCrypt.Net;
using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;


namespace EcoMind.API.Services
{
    public class WorkerService : IWorkerService
    {
        private readonly IWorkerRepository _workerRepository;
        private readonly IUserRepository _userRepository;

        public WorkerService(IWorkerRepository workerRepository, IUserRepository userRepository)
        {
            _workerRepository = workerRepository;
            _userRepository = userRepository;
        }

        public async Task<string> CreateWorkerAsync(CreateWorkerDto dto)
        {
            // Check if email already exists in User collection
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                return "Email already exists in user accounts.";
            }

            var existingWorker = await _workerRepository.GetWorkerByEmailAsync(dto.Email);
            if (existingWorker != null)
            {
                return "Worker with this email already exists.";
            }

            string rawPassword = string.IsNullOrWhiteSpace(dto.Password) ? "Worker@123" : dto.Password;
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(rawPassword);

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Password = hashedPassword,
                Role = "Worker",
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateAsync(user);

            var worker = new Worker
            {
                WorkerId = "WRK-" + Guid.NewGuid().ToString("N")[..6].ToUpper(),
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                WardId = dto.WardId,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _workerRepository.CreateWorkerAsync(worker);

            return "Worker Created Successfully";
        }

        public async Task<List<Worker>> GetAllWorkersAsync()
        {
            return await _workerRepository.GetAllWorkersAsync();
        }
    }
}