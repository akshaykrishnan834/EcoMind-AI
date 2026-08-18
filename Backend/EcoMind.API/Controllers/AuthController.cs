using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var result = await _authService.RegisterAsync(registerDto);

            if (result != "Registration Successful.")
            {
                return BadRequest(new { message = result });
            }

            return Ok(new { message = result });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _authService.LoginAsync(loginDto);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return Ok(new
            {
                message = "Login Successful.",
                email = user.Email,
                fullName = user.FullName,
                role = user.Role
            });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var result = await _authService.ChangePasswordAsync(dto);

            if (result != "Password updated successfully.")
            {
                return BadRequest(new { message = result });
            }

            return Ok(new { message = result });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var result = await _authService.SendForgotPasswordOtpAsync(dto);

            if (!result.StartsWith("OTP sent") && !result.StartsWith("OTP generated"))
            {
                return BadRequest(new { message = result });
            }

            string? devOtp = _authService.GetDevOtp(dto.Email);

            return Ok(new { 
                message = result,
                devOtpCode = devOtp
            });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var result = await _authService.VerifyOtpAsync(dto);

            if (result != "OTP verified successfully.")
            {
                return BadRequest(new { message = result });
            }

            return Ok(new { message = result });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _authService.ResetPasswordAsync(dto);

            if (result != "Password reset successfully. You can now log in with your new password.")
            {
                return BadRequest(new { message = result });
            }

            return Ok(new { message = result });
        }

        [HttpGet("check-email")]
        public async Task<IActionResult> CheckEmail([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return Ok(new { exists = false });
            }

            var exists = await _authService.CheckEmailExistsAsync(email);
            return Ok(new { exists });
        }

        [HttpGet("check-phone")]
        public async Task<IActionResult> CheckPhone([FromQuery] string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
            {
                return Ok(new { exists = false });
            }

            var exists = await _authService.CheckPhoneExistsAsync(phone);
            return Ok(new { exists });
        }
    }
}
