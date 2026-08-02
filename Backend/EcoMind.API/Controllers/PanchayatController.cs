using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PanchayatController : ControllerBase
    {
        private readonly IPanchayatService _panchayatService;

        public PanchayatController(IPanchayatService panchayatService)
        {
            _panchayatService = panchayatService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreatePanchayatDto dto)
        {
            await _panchayatService.CreatePanchayatAsync(dto);
            return Ok("Panchayat Created Successfully");
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var result = await _panchayatService.GetPanchayatAsync();
            return Ok(result);
        }
    }
}