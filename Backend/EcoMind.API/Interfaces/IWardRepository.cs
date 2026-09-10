using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IWardRepository
    {
        Task CreateWardAsync(Ward ward);

        Task<List<Ward>> GetAllWardsAsync();

        Task<Ward?> GetWardByIdAsync(string wardId);

        Task DeleteWardsByPanchayatNameAsync(string panchayatName);

        Task UpdateWardBoundaryAsync(string wardId, List<List<double>> boundary);
    }
}