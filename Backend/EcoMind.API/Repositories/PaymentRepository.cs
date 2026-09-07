using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using EcoMind.API.Services;
using MongoDB.Driver;

namespace EcoMind.API.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly IMongoCollection<Payment> _payments;

        public PaymentRepository(MongoDbService mongoDbService)
        {
            _payments = mongoDbService.Database
                .GetCollection<Payment>("Payments");
        }

        public async Task CreateAsync(Payment payment)
        {
            await _payments.InsertOneAsync(payment);
        }

        public async Task UpdateAsync(Payment payment)
        {
            await _payments.ReplaceOneAsync(x => x.Id == payment.Id, payment);
        }

        public async Task<Payment?> GetByCitizenAndPeriodAsync(string citizenId, int year, int month)
        {
            return await _payments
                .Find(x => x.CitizenId == citizenId && x.Year == year && x.Month == month)
                .FirstOrDefaultAsync();
        }

        public async Task<List<Payment>> GetByCitizenIdAsync(string citizenId)
        {
            return await _payments
                .Find(x => x.CitizenId == citizenId)
                .SortByDescending(x => x.Year)
                .ThenByDescending(x => x.Month)
                .ToListAsync();
        }

        public async Task<List<Payment>> GetAllAsync()
        {
            return await _payments
                .Find(_ => true)
                .SortByDescending(x => x.Year)
                .ThenByDescending(x => x.Month)
                .ToListAsync();
        }
    }
}
