using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface ICitizenRepository
    {
        Task CreateCitizenAsync(Citizen citizen);

        Task<Citizen?> GetCitizenByEmailAsync(string email);

        Task<List<Citizen>> GetAllCitizensAsync();

        Task UpdateCitizenAsync(Citizen citizen);
    }
}