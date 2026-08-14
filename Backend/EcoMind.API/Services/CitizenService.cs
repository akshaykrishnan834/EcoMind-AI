using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class CitizenService : ICitizenService
    {
        private readonly ICitizenRepository _citizenRepository;
        private readonly IUserRepository _userRepository;

        public CitizenService(
            ICitizenRepository citizenRepository,
            IUserRepository userRepository)
        {
            _citizenRepository = citizenRepository;
            _userRepository = userRepository;
        }

        // ============================================================
        // CREATE CITIZEN
        // ============================================================
        public async Task CreateCitizenAsync(CreateCitizenDto dto)
        {
            var citizen = new Citizen
            {
                CitizenId = "CIT" + Random.Shared.Next(1000, 9999),

                FullName = dto.FullName,

                Email = dto.Email,

                PhoneNumber = dto.PhoneNumber,

                Address = dto.Address,

                HouseName = dto.HouseName,

                // House number
                HouseNumber = dto.HouseNumber,

                WardId = dto.WardId,

                PanchayatName = dto.PanchayatName,

                // Location
                Latitude = 0,

                Longitude = 0,

                Status = "Active",

                ProfileCompleted = true,

                CreatedAt = DateTime.UtcNow
            };

            await _citizenRepository.CreateCitizenAsync(citizen);
        }


        // ============================================================
        // GET CITIZEN BY EMAIL
        // ============================================================
        public async Task<Citizen?> GetCitizenByEmailAsync(string email)
        {
            var citizen =
                await _citizenRepository.GetCitizenByEmailAsync(email);

            var user =
                await _userRepository.GetByEmailAsync(email);

            // --------------------------------------------------------
            // Citizen already exists
            // --------------------------------------------------------
            if (citizen != null)
            {
                if (user != null)
                {
                    bool needsUpdate = false;

                    // Synchronize phone number
                    if (
                        string.IsNullOrWhiteSpace(citizen.PhoneNumber)
                        &&
                        !string.IsNullOrWhiteSpace(user.PhoneNumber)
                    )
                    {
                        citizen.PhoneNumber = user.PhoneNumber;
                        needsUpdate = true;
                    }

                    // Synchronize full name
                    if (
                        string.IsNullOrWhiteSpace(citizen.FullName)
                        &&
                        !string.IsNullOrWhiteSpace(user.FullName)
                    )
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


            // --------------------------------------------------------
            // Citizen document doesn't exist
            // but User document exists
            // --------------------------------------------------------
            if (
                user != null
                &&
                string.Equals(
                    user.Role,
                    "Citizen",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                var newCitizen = new Citizen
                {
                    CitizenId =
                        "CIT" + Random.Shared.Next(1000, 9999),

                    FullName = user.FullName,

                    Email = user.Email,

                    PhoneNumber = user.PhoneNumber,

                    Address = string.Empty,

                    HouseNumber = string.Empty,

                    WardId = string.Empty,

                    PanchayatName = string.Empty,

                    Latitude = 0,

                    Longitude = 0,

                    Status = "Active",

                    ProfileCompleted = false,

                    CreatedAt = DateTime.UtcNow
                };

                await _citizenRepository.CreateCitizenAsync(
                    newCitizen
                );

                return newCitizen;
            }

            return null;
        }


        // ============================================================
        // GET ALL CITIZENS
        // ============================================================
        public async Task<List<Citizen>> GetAllCitizensAsync()
        {
            return await _citizenRepository.GetAllCitizensAsync();
        }


        // ============================================================
        // GET CITIZENS BY WARD
        // ============================================================
        public async Task<List<Citizen>> GetCitizensByWardAsync(string wardId)
        {
            return await _citizenRepository.GetCitizensByWardAsync(wardId);
        }


        // ============================================================
        // UPDATE CITIZEN PROFILE
        // ============================================================
        public async Task<string> UpdateCitizenAsync(
            UpdateCitizenDto dto)
        {
            if (
                dto == null
                ||
                string.IsNullOrWhiteSpace(dto.Email)
            )
            {
                return "Invalid citizen profile data.";
            }


            // Find citizen using email
            var citizen =
                await _citizenRepository.GetCitizenByEmailAsync(
                    dto.Email
                );

            if (citizen == null)
            {
                return "Citizen record not found.";
            }


            // --------------------------------------------------------
            // PHONE NUMBER VALIDATION
            // --------------------------------------------------------
            string cleanPhone =
                dto.PhoneNumber?.Trim() ?? "";

            if (!string.IsNullOrWhiteSpace(cleanPhone))
            {
                if (
                    cleanPhone.Length != 10
                    ||
                    !System.Text.RegularExpressions.Regex.IsMatch(
                        cleanPhone,
                        "^[6-9][0-9]{9}$"
                    )
                )
                {
                    return
                        "Phone number must contain exactly 10 digits starting with 6, 7, 8, or 9.";
                }


                // Check whether phone number already belongs
                // to another user
                var existingUserByPhone =
                    await _userRepository.GetByPhoneNumberAsync(
                        cleanPhone
                    );

                var userAccount =
                    await _userRepository.GetByEmailAsync(
                        dto.Email
                    );


                if (
                    existingUserByPhone != null
                    &&
                    (
                        userAccount == null
                        ||
                        existingUserByPhone.Id != userAccount.Id
                    )
                )
                {
                    return
                        "Phone number is already registered to another account.";
                }
            }


            // --------------------------------------------------------
            // BASIC PROFILE INFORMATION
            // --------------------------------------------------------

            if (!string.IsNullOrWhiteSpace(dto.FullName))
            {
                citizen.FullName =
                    dto.FullName.Trim();
            }

            citizen.PhoneNumber = cleanPhone;


            // --------------------------------------------------------
            // HOUSE NAME
            // --------------------------------------------------------

            if (dto.HouseName != null)
            {
                citizen.HouseName =
                    dto.HouseName.Trim();
            }


            // --------------------------------------------------------
            // HOUSE NUMBER
            // --------------------------------------------------------

            if (dto.HouseNumber != null)
            {
                citizen.HouseNumber =
                    dto.HouseNumber.Trim();
            }


            // --------------------------------------------------------
            // ADDRESS
            // --------------------------------------------------------

            if (dto.Address != null)
            {
                citizen.Address =
                    dto.Address.Trim();
            }


            // --------------------------------------------------------
            // LATITUDE
            // --------------------------------------------------------

            if (dto.Latitude.HasValue)
            {
                if (
                    dto.Latitude.Value < -90
                    ||
                    dto.Latitude.Value > 90
                )
                {
                    return "Invalid latitude.";
                }

                citizen.Latitude =
                    dto.Latitude.Value;
            }


            // --------------------------------------------------------
            // LONGITUDE
            // --------------------------------------------------------

            if (dto.Longitude.HasValue)
            {
                if (
                    dto.Longitude.Value < -180
                    ||
                    dto.Longitude.Value > 180
                )
                {
                    return "Invalid longitude.";
                }

                citizen.Longitude =
                    dto.Longitude.Value;
            }


            // --------------------------------------------------------
            // WARD
            // --------------------------------------------------------

            if (dto.WardId != null)
            {
                citizen.WardId =
                    dto.WardId.Trim();
            }


            // --------------------------------------------------------
            // PANCHAYAT
            // --------------------------------------------------------

            if (dto.PanchayatName != null)
            {
                citizen.PanchayatName =
                    dto.PanchayatName.Trim();
            }


            // --------------------------------------------------------
            // PROFILE COMPLETION
            // --------------------------------------------------------

            if (
                !string.IsNullOrWhiteSpace(citizen.FullName)
                &&
                !string.IsNullOrWhiteSpace(citizen.PhoneNumber)
                &&
                !string.IsNullOrWhiteSpace(citizen.HouseNumber)
                &&
                !string.IsNullOrWhiteSpace(citizen.Address)
                &&
                !string.IsNullOrWhiteSpace(citizen.WardId)
                &&
                !string.IsNullOrWhiteSpace(citizen.PanchayatName)
            )
            {
                citizen.ProfileCompleted = true;
            }


            // --------------------------------------------------------
            // SAVE CITIZEN
            // --------------------------------------------------------

            await _citizenRepository.UpdateCitizenAsync(
                citizen
            );


            // --------------------------------------------------------
            // SYNCHRONIZE USER ACCOUNT
            // --------------------------------------------------------

            var user =
                await _userRepository.GetByEmailAsync(
                    dto.Email
                );

            if (user != null)
            {
                user.FullName =
                    citizen.FullName;

                user.PhoneNumber =
                    citizen.PhoneNumber;

                await _userRepository.UpdateAsync(user);
            }


            return "Profile Updated Successfully";
        }


        // ============================================================
        // UPDATE CITIZEN LOCATION
        // ============================================================
        public async Task<bool> UpdateLocationAsync(
            string citizenId,
            UpdateCitizenLocationDto dto)
        {
            if (dto == null)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(dto.Address))
            {
                return false;
            }

            if (
                dto.Latitude < -90
                ||
                dto.Latitude > 90
            )
            {
                return false;
            }

            if (
                dto.Longitude < -180
                ||
                dto.Longitude > 180
            )
            {
                return false;
            }


            return await _citizenRepository.UpdateLocationAsync(
                citizenId,
                dto.Address.Trim(),
                dto.Latitude,
                dto.Longitude
            );
        }
    }
}