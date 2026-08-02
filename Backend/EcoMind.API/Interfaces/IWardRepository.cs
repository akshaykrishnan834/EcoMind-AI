using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IWardRepository
    {
        Task CreateWardAsync(Ward ward);

        Task<List<Ward>> GetAllWardsAsync();

        Task<Ward?> GetWardByIdAsync(string wardId);
    }
}