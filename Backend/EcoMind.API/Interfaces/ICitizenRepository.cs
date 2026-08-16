using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface ICitizenRepository
    {
        Task CreateCitizenAsync(Citizen citizen);

        Task<Citizen?> GetCitizenByEmailAsync(string email);

        Task<Citizen?> GetCitizenByCitizenIdAsync(string citizenId);

        Task<List<Citizen>> GetAllCitizensAsync();

        Task<List<Citizen>> GetCitizensByWardAsync(string wardId);

        Task UpdateCitizenAsync(Citizen citizen);

        Task<bool> UpdateLocationAsync(
            string citizenId,
            string address,
            double latitude,
            double longitude);
    }
}