using EcoMind.API.DTOs;
using EcoMind.API.Models;

namespace EcoMind.API.Interfaces
{
    public interface IPaymentService
    {
        Task<List<Payment>> GetCitizenMonthlyPaymentsAsync(string citizenId);
        Task<Payment?> GetCurrentMonthPaymentAsync(string citizenId);
        Task<Payment> ProcessPaymentAsync(ProcessPaymentDto dto);
        Task<RazorpayOrderResponseDto> CreateRazorpayOrderAsync(CreateRazorpayOrderDto dto);
        Task<Payment> VerifyRazorpayPaymentAsync(VerifyRazorpayPaymentDto dto);
        Task<Payment> ProcessWorkerPaymentAsync(ProcessWorkerPaymentDto dto);
    }
}
