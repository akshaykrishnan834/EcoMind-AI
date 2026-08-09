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

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                var existingPhoneUser = await _userRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
                if (existingPhoneUser != null)
                {
                    return "Phone number already exists in user accounts.";
                }
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

        public async Task<string> UpdateWorkerAsync(UpdateWorkerDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Id))
            {
                return "Invalid worker ID.";
            }

            var workers = await _workerRepository.GetAllWorkersAsync();
            var worker = workers.FirstOrDefault(w => w.Id == dto.Id);
            if (worker == null)
            {
                return "Worker record not found.";
            }

            string cleanPhone = dto.PhoneNumber?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(cleanPhone) || cleanPhone.Length != 10 || !System.Text.RegularExpressions.Regex.IsMatch(cleanPhone, "^[6-9][0-9]{9}$"))
            {
                return "Phone number must contain exactly 10 digits starting with 6, 7, 8, or 9.";
            }

            var existingUserWithPhone = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
            var user = await _userRepository.GetByEmailAsync(worker.Email);

            if (existingUserWithPhone != null && (user == null || existingUserWithPhone.Id != user.Id))
            {
                return "Phone number is already registered to another account.";
            }

            worker.FullName = string.IsNullOrWhiteSpace(dto.FullName) ? worker.FullName : dto.FullName.Trim();
            worker.PhoneNumber = cleanPhone;
            worker.WardId = dto.WardId ?? worker.WardId;
            worker.Status = string.IsNullOrWhiteSpace(dto.Status) ? worker.Status : dto.Status.Trim();

            await _workerRepository.UpdateWorkerAsync(worker);

            if (user != null)
            {
                user.FullName = worker.FullName;
                user.PhoneNumber = cleanPhone;
                await _userRepository.UpdateAsync(user);
            }

            return "Worker Updated Successfully";
        }
    }
}