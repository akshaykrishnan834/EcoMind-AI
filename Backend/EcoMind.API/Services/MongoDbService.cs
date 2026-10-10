using System.Security.Authentication;
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
            var mongoClientSettings = MongoClientSettings.FromConnectionString(settings.Value.ConnectionString);

            // Configure TLS settings to prevent Windows Schannel 0x80090304 error
            if (mongoClientSettings.UseTls)
            {
                mongoClientSettings.SslSettings = new SslSettings
                {
                    CheckCertificateRevocation = false,
                    EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13,
                    ServerCertificateValidationCallback = (sender, certificate, chain, errors) => true
                };
            }

            var client = new MongoClient(mongoClientSettings);
            Database = client.GetDatabase(settings.Value.DatabaseName);
        }
    }
}