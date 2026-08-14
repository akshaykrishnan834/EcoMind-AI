using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CitizenController : ControllerBase
    {
        private readonly ICitizenService _citizenService;

        public CitizenController(ICitizenService citizenService)
        {
            _citizenService = citizenService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateCitizen(CreateCitizenDto dto)
        {
            await _citizenService.CreateCitizenAsync(dto);

            return Ok(new
            {
                message = "Citizen created successfully"
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCitizens()
        {
            var citizens = await _citizenService.GetAllCitizensAsync();

            return Ok(citizens);
        }

        [HttpGet("ward/{wardId}")]
        public async Task<IActionResult> GetCitizensByWard(string wardId)
        {
            var citizens = await _citizenService.GetCitizensByWardAsync(wardId);
            return Ok(citizens);
        }

        [HttpGet("{email}")]
        public async Task<IActionResult> GetCitizenByEmail(string email)
        {
            var citizen = await _citizenService.GetCitizenByEmailAsync(email);

            if (citizen == null)
            {
                return NotFound("Citizen not found");
            }

            return Ok(citizen);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateCitizenProfile([FromBody] UpdateCitizenDto dto)
        {
            var result = await _citizenService.UpdateCitizenAsync(dto);

            if (result != "Profile Updated Successfully")
            {
                return BadRequest(result);
            }

            return Ok(new
            {
                message = result
            });
        }
        [HttpPut("{citizenId}/location")]
        public async Task<IActionResult> UpdateLocation(
    string citizenId,
    UpdateCitizenLocationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Address))
            {
                return BadRequest("Address is required.");
            }

            if (dto.Latitude < -90 || dto.Latitude > 90)
            {
                return BadRequest("Invalid latitude.");
            }

            if (dto.Longitude < -180 || dto.Longitude > 180)
            {
                return BadRequest("Invalid longitude.");
            }

            var updated =
                await _citizenService.UpdateLocationAsync(
                    citizenId,
                    dto);

            if (!updated)
            {
                return NotFound("Citizen not found.");
            }

            return Ok(new
            {
                message = "Location updated successfully."
            });
        }
    }
}