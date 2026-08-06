using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IUserRepository
    {
        Task<List<User>> GetAllAsync();

        Task<User?> GetByEmailAsync(string email);

        Task CreateAsync(User user);

        Task DeleteAsync(string id);
    }
}