using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IWardService
    {
        Task CreateWardAsync(CreateWardDto dto);

        Task<List<Ward>> GetAllWardsAsync();
    }
}