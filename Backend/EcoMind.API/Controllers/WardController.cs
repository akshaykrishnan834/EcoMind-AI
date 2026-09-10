using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WardController : ControllerBase
    {
        private readonly IWardService _wardService;

        public WardController(IWardService wardService)
        {
            _wardService = wardService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWard(CreateWardDto dto)
        {
            await _wardService.CreateWardAsync(dto);

            return Ok("Ward Created Successfully");
        }

        [HttpGet]
        public async Task<IActionResult> GetAllWards()
        {
            var wards = await _wardService.GetAllWardsAsync();

            return Ok(wards);
        }

        [HttpPut("{wardId}/boundary")]
        public async Task<IActionResult> UpdateWardBoundary(string wardId, [FromBody] List<List<double>> boundary)
        {
            await _wardService.UpdateWardBoundaryAsync(wardId, boundary);
            return Ok(new { message = "Ward boundary updated successfully" });
        }

        [HttpGet("identify")]
        public async Task<IActionResult> IdentifyWard([FromQuery] double lat, [FromQuery] double lng)
        {
            var wardId = await _wardService.IdentifyWardByLocationAsync(lat, lng);
            if (wardId != null)
            {
                return Ok(new { wardId });
            }
            return NotFound(new { message = "Location is outside all ward boundaries." });
        }

        [HttpGet("official-boundary")]
        public async Task<IActionResult> GetOfficialBoundary([FromQuery] string panchayatName, [FromQuery] string wardIdentifier, [FromQuery] string? wardName = null)
        {
            var boundary = await _wardService.GetOfficialBoundaryAsync(panchayatName, wardIdentifier, wardName);
            if (boundary != null && boundary.Count > 0)
            {
                return Ok(new { 
                    panchayatName, 
                    wardIdentifier, 
                    wardName,
                    boundary,
                    source = "https://wardmap.ksmart.live/"
                });
            }
            return NotFound(new { message = "Official boundary not found for the specified ward/panchayat." });
        }
    }
}