using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface ICitizenService
    {
        Task CreateCitizenAsync(CreateCitizenDto dto);

        Task<Citizen?> GetCitizenByEmailAsync(string email);

        Task<List<Citizen>> GetAllCitizensAsync();

        Task<string> UpdateCitizenAsync(UpdateCitizenDto dto);
    }
}