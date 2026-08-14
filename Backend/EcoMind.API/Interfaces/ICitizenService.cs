using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface ICitizenService
    {
        Task CreateCitizenAsync(CreateCitizenDto dto);

        Task<Citizen?> GetCitizenByEmailAsync(string email);

        Task<List<Citizen>> GetAllCitizensAsync();

        Task<List<Citizen>> GetCitizensByWardAsync(string wardId);

        Task<string> UpdateCitizenAsync(UpdateCitizenDto dto);

        Task<bool> UpdateLocationAsync(
            string citizenId,
            UpdateCitizenLocationDto dto);
    }
}