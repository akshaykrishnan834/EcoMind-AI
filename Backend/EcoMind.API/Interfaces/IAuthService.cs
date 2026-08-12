using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterDto registerDto);

        Task<User?> LoginAsync(LoginDto loginDto);

        Task<string> ChangePasswordAsync(ChangePasswordDto dto);
    }
}