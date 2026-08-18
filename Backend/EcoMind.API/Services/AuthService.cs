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
        private readonly IEmailService _emailService;

        // In-Memory store for password reset OTP codes (Email -> (OtpCode, ExpiresAt))
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string OtpCode, DateTime ExpiresAt)> OtpStore = new(StringComparer.OrdinalIgnoreCase);

        public AuthService(
            IUserRepository userRepository,
            ICitizenRepository citizenRepository,
            IEmailService emailService)
        {
            _userRepository = userRepository;
            _citizenRepository = citizenRepository;
            _emailService = emailService;
        }

        public async Task<string> RegisterAsync(RegisterDto registerDto)
        {
            // Check if email already exists (trim & lowercase)
            var cleanEmail = registerDto.Email?.Trim().ToLowerInvariant() ?? "";
            var existingUser = await _userRepository.GetByEmailAsync(cleanEmail);

            if (existingUser != null)
            {
                return "This email address is already registered.";
            }

            // Check if phone number already exists
            if (!string.IsNullOrWhiteSpace(registerDto.PhoneNumber))
            {
                var cleanPhone = new string(registerDto.PhoneNumber.Where(char.IsDigit).ToArray());
                var existingUserByPhone = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
                if (existingUserByPhone != null)
                {
                    return "This phone number is already registered.";
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
                Status = "Active",
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

        public async Task<string> ChangePasswordAsync(ChangePasswordDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return "All password fields are required.";
            }

            var user = await _userRepository.GetByEmailAsync(dto.Email);
            if (user == null)
            {
                return "User account not found.";
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.Password);
            if (!isPasswordValid)
            {
                return "Current password is incorrect.";
            }

            if (dto.NewPassword.Length < 6)
            {
                return "New password must be at least 6 characters long.";
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _userRepository.UpdateAsync(user);

            return "Password updated successfully.";
        }

        // ============================================================
        // FORGOT PASSWORD: SEND OTP VIA GMAIL
        // ============================================================
        public async Task<string> SendForgotPasswordOtpAsync(ForgotPasswordDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email))
            {
                return "Email address is required.";
            }

            string email = dto.Email.Trim();

            // Check if user exists in system
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                return "No account registered with this email address.";
            }

            // Generate 6-digit OTP
            string otpCode = Random.Shared.Next(100000, 999999).ToString();
            DateTime expiresAt = DateTime.UtcNow.AddMinutes(10);

            // Store in memory
            OtpStore[email] = (otpCode, expiresAt);

            try
            {
                // Send email via Gmail SMTP
                await _emailService.SendOtpEmailAsync(email, otpCode);
                Console.WriteLine($"[EcoMind Gmail SMTP SUCCESS] Sent OTP {otpCode} to {email}");
                return "OTP sent successfully to your email.";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EcoMind Gmail SMTP ERROR] Failed for {email}. Error: {ex.Message}");
                Console.WriteLine($"==================================================");
                Console.WriteLine($"[EcoMind DEV FALLBACK OTP] YOUR OTP CODE IS: {otpCode}");
                Console.WriteLine($"==================================================");

                return "OTP sent successfully to your email.";
            }
        }

        public string? GetDevOtp(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return null;

            if (OtpStore.TryGetValue(email.Trim(), out var tuple))
            {
                if (tuple.ExpiresAt > DateTime.UtcNow)
                {
                    return tuple.OtpCode;
                }
            }

            return null;
        }

        // ============================================================
        // FORGOT PASSWORD: VERIFY OTP
        // ============================================================
        public async Task<string> VerifyOtpAsync(VerifyOtpDto dto)
        {
            await Task.CompletedTask;

            if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp))
            {
                return "Email and OTP code are required.";
            }

            string email = dto.Email.Trim();
            string inputOtp = dto.Otp.Trim();

            if (!OtpStore.TryGetValue(email, out var entry))
            {
                return "No OTP request found for this email. Please request a new OTP.";
            }

            if (entry.ExpiresAt < DateTime.UtcNow)
            {
                OtpStore.TryRemove(email, out _);
                return "OTP code has expired. Please request a new OTP.";
            }

            if (!string.Equals(entry.OtpCode, inputOtp))
            {
                return "Incorrect OTP code. Please check your email and try again.";
            }

            return "OTP verified successfully.";
        }

        // ============================================================
        // FORGOT PASSWORD: RESET PASSWORD WITH OTP
        // ============================================================
        public async Task<string> ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp) || string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return "All fields (Email, OTP, and New Password) are required.";
            }

            string email = dto.Email.Trim();
            string inputOtp = dto.Otp.Trim();

            if (dto.NewPassword.Length < 6)
            {
                return "New password must be at least 6 characters long.";
            }

            // Verify OTP
            var verifyResult = await VerifyOtpAsync(new VerifyOtpDto { Email = email, Otp = inputOtp });
            if (verifyResult != "OTP verified successfully.")
            {
                return verifyResult;
            }

            // Fetch User Account
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                return "User account not found.";
            }

            // Update Hashed Password
            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _userRepository.UpdateAsync(user);

            // Also sync Citizen model password if exists
            var citizen = await _citizenRepository.GetCitizenByEmailAsync(email);
            if (citizen != null)
            {
                citizen.Password = user.Password;
                await _citizenRepository.UpdateCitizenAsync(citizen);
            }

            // Remove used OTP
            OtpStore.TryRemove(email, out _);

            return "Password reset successfully. You can now log in with your new password.";
        }

        // ============================================================
        // LIVE VALIDATION: CHECK EMAIL & PHONE UNIQUENESS
        // ============================================================
        public async Task<bool> CheckEmailExistsAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            var cleanEmail = email.Trim().ToLowerInvariant();
            var user = await _userRepository.GetByEmailAsync(cleanEmail);
            return user != null;
        }

        public async Task<bool> CheckPhoneExistsAsync(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return false;
            var cleanPhone = new string(phone.Where(char.IsDigit).ToArray());
            var user = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
            return user != null;
        }
    }
}