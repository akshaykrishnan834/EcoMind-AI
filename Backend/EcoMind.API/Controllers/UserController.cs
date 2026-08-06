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

        public UserController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
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
