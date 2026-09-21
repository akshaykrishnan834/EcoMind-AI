namespace EcoMind.API.Interfaces
{
    public interface IAIService
    {
        Task<string> GetResponseAsync(string message);
    }
}