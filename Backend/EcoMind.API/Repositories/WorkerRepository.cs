using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class WorkerRepository : IWorkerRepository
    {
        private readonly IMongoCollection<Worker> _workers;

        public WorkerRepository(MongoDbService mongoDbService)
        {
            _workers = mongoDbService.Database.GetCollection<Worker>("Workers");
        }

        public async Task CreateWorkerAsync(Worker worker)
        {
            await _workers.InsertOneAsync(worker);
        }

        public async Task<List<Worker>> GetAllWorkersAsync()
        {
            return await _workers.Find(_ => true).ToListAsync();
        }

        public async Task<Worker?> GetWorkerByEmailAsync(string email)
        {
            return await _workers.Find(x => x.Email == email).FirstOrDefaultAsync();
        }

        public async Task UpdateWorkerAsync(Worker worker)
        {
            await _workers.ReplaceOneAsync(x => x.Id == worker.Id, worker);
        }
    }
}