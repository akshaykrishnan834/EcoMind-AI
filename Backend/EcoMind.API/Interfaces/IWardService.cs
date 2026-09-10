using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IWardService
    {
        Task CreateWardAsync(CreateWardDto dto);

        Task<List<Ward>> GetAllWardsAsync();

        Task UpdateWardBoundaryAsync(string wardId, List<List<double>> boundary);

        Task<string?> IdentifyWardByLocationAsync(double latitude, double longitude);
        Task<List<List<double>>?> GetOfficialBoundaryAsync(string panchayatName, string wardIdentifier, string? wardName = null);
    }
}