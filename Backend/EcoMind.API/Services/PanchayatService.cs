using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;

namespace EcoMind.API.Services
{
    public class PanchayatService : IPanchayatService
    {
        private readonly IPanchayatRepository _panchayatRepository;
        private readonly IWardRepository _wardRepository;

        public PanchayatService(
            IPanchayatRepository panchayatRepository,
            IWardRepository wardRepository)
        {
            _panchayatRepository = panchayatRepository;
            _wardRepository = wardRepository;
        }

        public async Task CreatePanchayatAsync(CreatePanchayatDto dto)
        {
            // Create Panchayat
            var panchayat = new Panchayat
            {
                PanchayatId = "P001",
                PanchayatName = dto.PanchayatName,
                District = dto.District,
                NumberOfWards = dto.NumberOfWards,
                State = "Kerala",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            // Save Panchayat
            await _panchayatRepository.CreatePanchayatAsync(panchayat);

            // Automatically Create Wards
            for (int i = 1; i <= dto.NumberOfWards; i++)
            {
                var ward = new Ward
                {
                    WardId = $"W{i:D3}",
                    WardName = $"Ward {i}",
                    PanchayatName = dto.PanchayatName,
                    Status = "Active"
                };

                await _wardRepository.CreateWardAsync(ward);
            }
        }

        public async Task<Panchayat?> GetPanchayatAsync()
        {
            return await _panchayatRepository.GetPanchayatAsync();
        }
    }
}