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
    }
}