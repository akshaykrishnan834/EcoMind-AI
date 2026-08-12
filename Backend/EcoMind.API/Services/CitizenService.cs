using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class CitizenService : ICitizenService
    {
        private readonly ICitizenRepository _citizenRepository;
        private readonly IUserRepository _userRepository;

        public CitizenService(ICitizenRepository citizenRepository, IUserRepository userRepository)
        {
            _citizenRepository = citizenRepository;
            _userRepository = userRepository;
        }

        public async Task CreateCitizenAsync(CreateCitizenDto dto)
        {
            var citizen = new Citizen
            {
                CitizenId = "CIT" + Random.Shared.Next(1000, 9999),

                FullName = dto.FullName,

                Email = dto.Email,

                PhoneNumber = dto.PhoneNumber,

                Address = dto.Address,

                WardId = dto.WardId,

                PanchayatName = dto.PanchayatName,

                Status = "Active",

                ProfileCompleted = true,

                CreatedAt = DateTime.UtcNow
            };

            await _citizenRepository.CreateCitizenAsync(citizen);
        }

        public async Task<Citizen?> GetCitizenByEmailAsync(string email)
        {
            var citizen = await _citizenRepository.GetCitizenByEmailAsync(email);
            var user = await _userRepository.GetByEmailAsync(email);

            if (citizen != null)
            {
                if (user != null)
                {
                    bool needsUpdate = false;

                    if (string.IsNullOrWhiteSpace(citizen.PhoneNumber) && !string.IsNullOrWhiteSpace(user.PhoneNumber))
                    {
                        citizen.PhoneNumber = user.PhoneNumber;
                        needsUpdate = true;
                    }

                    if (string.IsNullOrWhiteSpace(citizen.FullName) && !string.IsNullOrWhiteSpace(user.FullName))
                    {
                        citizen.FullName = user.FullName;
                        needsUpdate = true;
                    }

                    if (needsUpdate)
                    {
                        await _citizenRepository.UpdateCitizenAsync(citizen);
                    }
                }
                return citizen;
            }

            // Fallback: If Citizen document doesn't exist yet but User document exists, create Citizen profile
            if (user != null && string.Equals(user.Role, "Citizen", StringComparison.OrdinalIgnoreCase))
            {
                var newCitizen = new Citizen
                {
                    CitizenId = "CIT" + Random.Shared.Next(1000, 9999),
                    FullName = user.FullName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Address = string.Empty,
                    WardId = string.Empty,
                    PanchayatName = string.Empty,
                    Status = "Active",
                    ProfileCompleted = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _citizenRepository.CreateCitizenAsync(newCitizen);
                return newCitizen;
            }

            return null;
        }

        public async Task<List<Citizen>> GetAllCitizensAsync()
        {
            return await _citizenRepository.GetAllCitizensAsync();
        }

        public async Task<string> UpdateCitizenAsync(UpdateCitizenDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email))
            {
                return "Invalid citizen profile data.";
            }

            var citizen = await _citizenRepository.GetCitizenByEmailAsync(dto.Email);
            if (citizen == null)
            {
                return "Citizen record not found.";
            }

            string cleanPhone = dto.PhoneNumber?.Trim() ?? "";
            if (!string.IsNullOrWhiteSpace(cleanPhone))
            {
                if (cleanPhone.Length != 10 || !System.Text.RegularExpressions.Regex.IsMatch(cleanPhone, "^[6-9][0-9]{9}$"))
                {
                    return "Phone number must contain exactly 10 digits starting with 6, 7, 8, or 9.";
                }

                var existingUserByPhone = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
                var userAccount = await _userRepository.GetByEmailAsync(dto.Email);

                if (existingUserByPhone != null && (userAccount == null || existingUserByPhone.Id != userAccount.Id))
                {
                    return "Phone number is already registered to another account.";
                }
            }

            citizen.FullName = string.IsNullOrWhiteSpace(dto.FullName) ? citizen.FullName : dto.FullName.Trim();
            citizen.PhoneNumber = cleanPhone;
            citizen.Address = dto.Address?.Trim() ?? "";
            citizen.WardId = dto.WardId?.Trim() ?? "";
            citizen.PanchayatName = dto.PanchayatName?.Trim() ?? "";

            if (!string.IsNullOrWhiteSpace(citizen.Address) && (!string.IsNullOrWhiteSpace(citizen.WardId) || !string.IsNullOrWhiteSpace(citizen.PanchayatName)))
            {
                citizen.ProfileCompleted = true;
            }

            await _citizenRepository.UpdateCitizenAsync(citizen);

            // Synchronize User account record
            var user = await _userRepository.GetByEmailAsync(dto.Email);
            if (user != null)
            {
                user.FullName = citizen.FullName;
                user.PhoneNumber = citizen.PhoneNumber;
                await _userRepository.UpdateAsync(user);
            }

            return "Profile Updated Successfully";
        }
    }
}