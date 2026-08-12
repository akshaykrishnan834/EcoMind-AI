using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IPanchayatService
    {
        Task CreatePanchayatAsync(CreatePanchayatDto dto);

        Task<Panchayat?> GetPanchayatAsync();

        Task<List<Panchayat>> GetAllPanchayatsAsync();
    }
}