using BCrypt.Net;
using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly ICitizenRepository _citizenRepository;

        public AuthService(IUserRepository userRepository, ICitizenRepository citizenRepository)
        {
            _userRepository = userRepository;
            _citizenRepository = citizenRepository;
        }

        public async Task<string> RegisterAsync(RegisterDto registerDto)
        {
            // Check if email already exists
            var existingUser = await _userRepository.GetByEmailAsync(registerDto.Email);

            if (existingUser != null)
            {
                return "Email already exists.";
            }

            // Check if phone number already exists
            if (!string.IsNullOrWhiteSpace(registerDto.PhoneNumber))
            {
                var existingUserByPhone = await _userRepository.GetByPhoneNumberAsync(registerDto.PhoneNumber);
                if (existingUserByPhone != null)
                {
                    return "Phone number already exists.";
                }
            }

            // Hash the password
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            string role = string.IsNullOrEmpty(registerDto.Role) ? "Citizen" : registerDto.Role;

            var user = new User
            {
                FullName = registerDto.FullName,
                Email = registerDto.Email,
                PhoneNumber = registerDto.PhoneNumber,
                Password = hashedPassword,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };

            // Save user to MongoDB
            await _userRepository.CreateAsync(user);

            // If registering a Citizen, also insert record into Citizens collection
            if (string.Equals(role, "Citizen", StringComparison.OrdinalIgnoreCase))
            {
                var existingCitizen = await _citizenRepository.GetCitizenByEmailAsync(registerDto.Email);
                if (existingCitizen == null)
                {
                    var citizen = new Citizen
                    {
                        CitizenId = "CIT" + Random.Shared.Next(1000, 9999),
                        FullName = registerDto.FullName,
                        Email = registerDto.Email,
                        PhoneNumber = registerDto.PhoneNumber,
                        Password = hashedPassword,
                        Address = string.Empty,
                        WardId = string.Empty,
                        PanchayatName = string.Empty,
                        Status = "Active",
                        ProfileCompleted = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _citizenRepository.CreateCitizenAsync(citizen);
                }
            }

            return "Registration Successful.";
        }

        public async Task<User?> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);

            if (user == null)
            {
                return null;
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password);

            if (!isPasswordValid)
            {
                return null;
            }

            return user;
        }
    }
}