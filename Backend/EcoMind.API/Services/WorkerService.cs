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

        public async Task<string> UpdateDutyStatusAsync(UpdateWorkerDutyDto dto)
        {
            if (dto == null)
            {
                return "Invalid duty update payload.";
            }

            Worker? worker = null;

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                worker = await _workerRepository.GetWorkerByEmailAsync(dto.Email.Trim());
            }

            if (worker == null && !string.IsNullOrWhiteSpace(dto.WorkerId))
            {
                var allWorkers = await _workerRepository.GetAllWorkersAsync();
                worker = allWorkers.FirstOrDefault(w => 
                    string.Equals(w.WorkerId, dto.WorkerId, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(w.Id, dto.WorkerId, StringComparison.OrdinalIgnoreCase));
            }

            if (worker == null)
            {
                return "Worker not found.";
            }

            worker.IsOnDuty = dto.IsOnDuty;
            if (dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                worker.CurrentLatitude = dto.Latitude.Value;
                worker.CurrentLongitude = dto.Longitude.Value;
            }
            worker.LastLocationUpdatedAt = DateTime.UtcNow;

            await _workerRepository.UpdateWorkerAsync(worker);
            return "Duty status updated successfully.";
        }

        public async Task<Worker?> GetLiveWorkerByWardAsync(string wardId)
        {
            if (string.IsNullOrWhiteSpace(wardId))
            {
                return null;
            }

            var cleanWard = wardId.Trim();
            var workers = await _workerRepository.GetWorkersByWardIdAsync(cleanWard);

            // Only return active on-duty worker with live GPS; if worker is not active, suppress location
            var activeWorker = workers.FirstOrDefault(w => w.IsOnDuty);
            if (activeWorker != null)
            {
                return activeWorker;
            }

            var defaultWorker = workers.FirstOrDefault();
            if (defaultWorker != null)
            {
                return new Worker
                {
                    Id = defaultWorker.Id,
                    WorkerId = defaultWorker.WorkerId,
                    FullName = defaultWorker.FullName,
                    Email = defaultWorker.Email,
                    PhoneNumber = defaultWorker.PhoneNumber,
                    WardId = defaultWorker.WardId,
                    CurrentWardId = defaultWorker.CurrentWardId,
                    IsOnDuty = false,
                    CurrentLatitude = null,
                    CurrentLongitude = null,
                    Status = defaultWorker.Status
                };
            }

            return null;
        }
    }
}