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
            var existingPanchayat = await _panchayatRepository.GetPanchayatAsync();

            var panchayat = new Panchayat
            {
                Id = existingPanchayat?.Id ?? string.Empty,
                PanchayatId = existingPanchayat?.PanchayatId ?? "P001",
                PanchayatName = dto.PanchayatName,
                District = dto.District,
                NumberOfWards = dto.NumberOfWards,
                State = "Kerala",
                Status = "Active",
                CreatedAt = existingPanchayat?.CreatedAt ?? DateTime.UtcNow
            };

            if (existingPanchayat != null)
            {
                await _panchayatRepository.UpdatePanchayatAsync(panchayat);
            }
            else
            {
                await _panchayatRepository.CreatePanchayatAsync(panchayat);
            }

            // Remove old wards for this Panchayat to avoid duplicate accumulations
            await _wardRepository.DeleteWardsByPanchayatNameAsync(dto.PanchayatName);

            // Create Wards (custom if provided, otherwise auto-generated)
            if (dto.Wards != null && dto.Wards.Count > 0)
            {
                int index = 1;
                foreach (var wardDto in dto.Wards)
                {
                    var ward = new Ward
                    {
                        WardId = string.IsNullOrWhiteSpace(wardDto.WardId) ? $"W{index:D3}" : wardDto.WardId,
                        WardName = string.IsNullOrWhiteSpace(wardDto.WardName) ? $"Ward {index}" : wardDto.WardName,
                        PanchayatName = dto.PanchayatName,
                        Status = string.IsNullOrWhiteSpace(wardDto.Status) ? "Active" : wardDto.Status
                    };

                    await _wardRepository.CreateWardAsync(ward);
                    index++;
                }
            }
            else
            {
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
        }

        public async Task<Panchayat?> GetPanchayatAsync()
        {
            return await _panchayatRepository.GetPanchayatAsync();
        }

        public async Task<List<Panchayat>> GetAllPanchayatsAsync()
        {
            return await _panchayatRepository.GetAllPanchayatsAsync();
        }
    }
}