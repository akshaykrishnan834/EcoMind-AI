using EcoMind.API.Services;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class WardRepository : IWardRepository
    {
        private readonly IMongoCollection<Ward> _wards;

        public WardRepository(MongoDbService mongoDbService)
        {
            _wards = mongoDbService.Database.GetCollection<Ward>("Wards");
        }

        public async Task CreateWardAsync(Ward ward)
        {
            await _wards.InsertOneAsync(ward);
        }

        public async Task<List<Ward>> GetAllWardsAsync()
        {
            return await _wards.Find(_ => true).ToListAsync();
        }

        public async Task<Ward?> GetWardByIdAsync(string wardId)
        {
            return await _wards.Find(x => x.WardId == wardId).FirstOrDefaultAsync();
        }
    }
}