using BCrypt.Net;
using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;

        public AuthService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<string> RegisterAsync(RegisterDto registerDto)
        {
            // Check if email already exists
            var existingUser = await _userRepository.GetByEmailAsync(registerDto.Email);

            if (existingUser != null)
            {
                return "Email already exists.";
            }

            // Hash the password
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            
            var user = new User
            {
                FullName = registerDto.FullName,
                Email = registerDto.Email,
                PhoneNumber = registerDto.PhoneNumber,
                Password = hashedPassword,
                Role = string.IsNullOrEmpty(registerDto.Role) ? "Citizen" : registerDto.Role,
                CreatedAt = DateTime.UtcNow
            };

            // Save user to MongoDB
            await _userRepository.CreateAsync(user);

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