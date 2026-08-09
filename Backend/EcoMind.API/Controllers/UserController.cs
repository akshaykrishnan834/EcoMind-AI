using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IWorkerRepository _workerRepository;

        public UserController(IUserRepository userRepository, IWorkerRepository workerRepository)
        {
            _userRepository = userRepository;
            _workerRepository = workerRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();
            
            // Clean sensitive information before returning
            var sanitizedUsers = users.Select(u => new
            {
                id = u.Id,
                fullName = u.FullName,
                email = u.Email,
                phoneNumber = u.PhoneNumber,
                role = u.Role,
                createdAt = u.CreatedAt
            });

            return Ok(sanitizedUsers);
        }

        [HttpGet("by-email/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Email is required.");
            }

            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                role = user.Role,
                createdAt = user.CreatedAt
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest("Invalid profile data.");
            }

            var user = await _userRepository.GetByEmailAsync(dto.Email);
            if (user == null)
            {
                return NotFound("User account not found.");
            }

            string cleanPhone = dto.PhoneNumber?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(cleanPhone) || cleanPhone.Length != 10 || !System.Text.RegularExpressions.Regex.IsMatch(cleanPhone, "^[6-9][0-9]{9}$"))
            {
                return BadRequest("Phone number must contain exactly 10 digits starting with 6, 7, 8, or 9.");
            }

            var existingWithPhone = await _userRepository.GetByPhoneNumberAsync(cleanPhone);
            if (existingWithPhone != null && existingWithPhone.Id != user.Id)
            {
                return BadRequest("Phone number is already registered to another account.");
            }

            user.FullName = string.IsNullOrWhiteSpace(dto.FullName) ? user.FullName : dto.FullName.Trim();
            user.PhoneNumber = cleanPhone;

            await _userRepository.UpdateAsync(user);

            var worker = await _workerRepository.GetWorkerByEmailAsync(dto.Email);
            if (worker != null)
            {
                worker.FullName = user.FullName;
                worker.PhoneNumber = cleanPhone;
                await _workerRepository.UpdateWorkerAsync(worker);
            }

            return Ok(new
            {
                message = "Profile updated successfully.",
                user = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    phoneNumber = user.PhoneNumber,
                    role = user.Role
                }
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("User ID is required.");
            }

            await _userRepository.DeleteAsync(id);
            return Ok(new { message = "User deleted successfully." });
        }
    }
}
