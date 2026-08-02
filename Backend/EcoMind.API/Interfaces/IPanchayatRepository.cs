using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IPanchayatRepository
    {
        Task CreatePanchayatAsync(Panchayat panchayat);

        Task<Panchayat?> GetPanchayatAsync();

        Task UpdatePanchayatAsync(Panchayat panchayat);
    }
}