using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class PanchayatRepository : IPanchayatRepository
    {
        private readonly IMongoCollection<Panchayat> _panchayats;

        public PanchayatRepository(MongoDbService mongoDbService)
        {
            _panchayats = mongoDbService.Database.GetCollection<Panchayat>("Panchayats");
        }

        public async Task CreatePanchayatAsync(Panchayat panchayat)
        {
            await _panchayats.InsertOneAsync(panchayat);
        }

        public async Task<Panchayat?> GetPanchayatAsync()
        {
            return await _panchayats.Find(_ => true).FirstOrDefaultAsync();
        }

        public async Task<List<Panchayat>> GetAllPanchayatsAsync()
        {
            return await _panchayats.Find(_ => true).ToListAsync();
        }

        public async Task UpdatePanchayatAsync(Panchayat panchayat)
        {
            await _panchayats.ReplaceOneAsync(x => x.Id == panchayat.Id, panchayat);
        }
    }
}