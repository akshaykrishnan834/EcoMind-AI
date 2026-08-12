using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IPanchayatRepository
    {
        Task CreatePanchayatAsync(Panchayat panchayat);

        Task<Panchayat?> GetPanchayatAsync();

        Task<List<Panchayat>> GetAllPanchayatsAsync();

        Task UpdatePanchayatAsync(Panchayat panchayat);
    }
}