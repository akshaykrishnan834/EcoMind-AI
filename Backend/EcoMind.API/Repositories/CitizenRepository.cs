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
            _citizens = mongoDbService.Database
                .GetCollection<Citizen>("Citizens");
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

        public async Task<List<Citizen>> GetCitizensByWardAsync(string wardId)
        {
            if (string.IsNullOrWhiteSpace(wardId))
            {
                return new List<Citizen>();
            }

            var cleanWard = wardId.Trim().ToLower();
            return await _citizens
                .Find(x => x.WardId != null && x.WardId.ToLower() == cleanWard)
                .ToListAsync();
        }

        public async Task UpdateCitizenAsync(Citizen citizen)
        {
            await _citizens.ReplaceOneAsync(
                x => x.Id == citizen.Id,
                citizen);
        }

        public async Task<bool> UpdateLocationAsync(
            string citizenId,
            string address,
            double latitude,
            double longitude)
        {
            var filter = Builders<Citizen>.Filter.Eq(
                x => x.CitizenId,
                citizenId);

            var update = Builders<Citizen>.Update
                .Set(x => x.Address, address)
                .Set(x => x.Latitude, latitude)
                .Set(x => x.Longitude, longitude);

            var result = await _citizens.UpdateOneAsync(
                filter,
                update);

            return result.MatchedCount > 0;
        }
    }
}