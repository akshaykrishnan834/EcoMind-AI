using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkerController : ControllerBase
    {
        private readonly IWorkerService _workerService;

        public WorkerController(IWorkerService workerService)
        {
            _workerService = workerService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorker(CreateWorkerDto dto)
        {
            var result = await _workerService.CreateWorkerAsync(dto);

            if (result.Contains("already exists"))
            {
                return BadRequest(result);
            }

            return Ok(new { message = result });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllWorkers()
        {
            var workers = await _workerService.GetAllWorkersAsync();

            return Ok(workers);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateWorker(UpdateWorkerDto dto)
        {
            var result = await _workerService.UpdateWorkerAsync(dto);

            if (result != "Worker Updated Successfully")
            {
                return BadRequest(result);
            }

            return Ok(new { message = result });
        }
    }
}