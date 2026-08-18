using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterDto registerDto);

        Task<User?> LoginAsync(LoginDto loginDto);

        Task<string> ChangePasswordAsync(ChangePasswordDto dto);

        Task<string> SendForgotPasswordOtpAsync(ForgotPasswordDto dto);

        Task<string> VerifyOtpAsync(VerifyOtpDto dto);

        Task<string> ResetPasswordAsync(ResetPasswordDto dto);

        Task<bool> CheckEmailExistsAsync(string email);

        Task<bool> CheckPhoneExistsAsync(string phone);

        string? GetDevOtp(string email);
    }
}