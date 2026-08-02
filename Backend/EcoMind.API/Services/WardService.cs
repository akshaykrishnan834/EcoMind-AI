using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class WardService : IWardService
    {
        private readonly IWardRepository _wardRepository;

        public WardService(IWardRepository wardRepository)
        {
            _wardRepository = wardRepository;
        }

        public async Task CreateWardAsync(CreateWardDto dto)
        {
            var ward = new Ward
            {
                WardId = dto.WardId,
                WardName = dto.WardName,
                PanchayatName = dto.PanchayatName,
                Status = dto.Status
            };

            await _wardRepository.CreateWardAsync(ward);
        }

        public async Task<List<Ward>> GetAllWardsAsync()
        {
            return await _wardRepository.GetAllWardsAsync();
        }
    }
}