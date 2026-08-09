using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class CitizenRepository : ICitizenRepository
    {
        private readonly IMongoCollection<Citizen> _citizens;

        public CitizenRepository(MongoDbService mongoDbService)
        {
            _citizens = mongoDbService.Database.GetCollection<Citizen>("Citizens");
        }

        public async Task CreateCitizenAsync(Citizen citizen)
        {
            await _citizens.InsertOneAsync(citizen);
        }

        public async Task<Citizen?> GetCitizenByEmailAsync(string email)
        {
            return await _citizens
                .Find(x => x.Email == email)
                .FirstOrDefaultAsync();
        }

        public async Task<List<Citizen>> GetAllCitizensAsync()
        {
            return await _citizens
                .Find(_ => true)
                .ToListAsync();
        }

        public async Task UpdateCitizenAsync(Citizen citizen)
        {
            await _citizens.ReplaceOneAsync(x => x.Id == citizen.Id, citizen);
        }
    }
}