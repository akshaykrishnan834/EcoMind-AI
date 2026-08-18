using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly IMongoCollection<User> _users;

        public UserRepository(MongoDbService mongoDbService)
        {
            _users = mongoDbService.Database.GetCollection<User>("Users");

            // Ensure unique indexes on Email and PhoneNumber
            try
            {
                var emailIndex = new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.Email),
                    new CreateIndexOptions { Unique = true, Sparse = true }
                );
                var phoneIndex = new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.PhoneNumber),
                    new CreateIndexOptions { Unique = true, Sparse = true }
                );
                _users.Indexes.CreateManyAsync(new[] { emailIndex, phoneIndex });
            }
            catch
            {
                // Ignore index creation errors if already exist
            }
        }

        public async Task<List<User>> GetAllAsync()
        {
            return await _users.Find(_ => true).ToListAsync();
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            var cleanEmail = email?.Trim().ToLowerInvariant() ?? "";
            return await _users.Find(x => x.Email.ToLower() == cleanEmail).FirstOrDefaultAsync();
        }

        public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
        {
            var cleanPhone = phoneNumber?.Trim() ?? "";
            return await _users.Find(x => x.PhoneNumber == cleanPhone).FirstOrDefaultAsync();
        }

        public async Task CreateAsync(User user)
        {
            await _users.InsertOneAsync(user);
        }

        public async Task DeleteAsync(string id)
        {
            await _users.DeleteOneAsync(x => x.Id == id);
        }

        public async Task UpdateAsync(User user)
        {
            await _users.ReplaceOneAsync(x => x.Id == user.Id, user);
        }
    }
}