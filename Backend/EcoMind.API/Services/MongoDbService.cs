using EcoMind.API.Configurations;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace EcoMind.API.Services
{
    public class MongoDbService
    {
        public IMongoDatabase Database { get; }

        public MongoDbService(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            Database = client.GetDatabase(settings.Value.DatabaseName);
        }
    }
}