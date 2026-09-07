using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EcoMind.API.Configurations;
using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using Microsoft.Extensions.Options;

namespace EcoMind.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly ICitizenRepository _citizenRepository;
        private readonly RazorpaySettings _razorpaySettings;
        private readonly HttpClient _httpClient;

        public PaymentService(
            IPaymentRepository paymentRepository,
            ICitizenRepository citizenRepository,
            IOptions<RazorpaySettings> razorpayOptions,
            HttpClient httpClient)
        {
            _paymentRepository = paymentRepository;
            _citizenRepository = citizenRepository;
            _razorpaySettings = razorpayOptions.Value;
            _httpClient = httpClient;
        }

        public async Task<List<Payment>> GetCitizenMonthlyPaymentsAsync(string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId))
            {
                return new List<Payment>();
            }

            var citizen = await _citizenRepository.GetCitizenByCitizenIdAsync(citizenId);
            DateTime startDate = DateTime.UtcNow;
            if (citizen != null)
            {
                startDate = citizen.VerifiedAt ?? citizen.CreatedAt;
            }

            var now = DateTime.UtcNow;
            int startYear = startDate.Year;
            int startMonth = startDate.Month;

            // Safety limit: don't look back further than 2 years
            if (startYear < now.Year - 2)
            {
                startYear = now.Year - 2;
            }

            var currentYear = now.Year;
            var currentMonth = now.Month;

            for (int y = startYear; y <= currentYear; y++)
            {
                int firstM = (y == startYear) ? startMonth : 1;
                int lastM = (y == currentYear) ? currentMonth : 12;

                for (int m = firstM; m <= lastM; m++)
                {
                    var existing = await _paymentRepository.GetByCitizenAndPeriodAsync(citizenId, y, m);
                    if (existing == null)
                    {
                        var newPayment = new Payment
                        {
                            PaymentId = $"PAY-{y}{m:D2}-{citizenId}",
                            CitizenId = citizenId,
                            Year = y,
                            Month = m,
                            Amount = 50.0,
                            Status = "Unpaid",
                            CreatedAt = DateTime.UtcNow
                        };
                        await _paymentRepository.CreateAsync(newPayment);
                    }
                }
            }

            return await _paymentRepository.GetByCitizenIdAsync(citizenId);
        }

        public async Task<Payment?> GetCurrentMonthPaymentAsync(string citizenId)
        {
            var payments = await GetCitizenMonthlyPaymentsAsync(citizenId);
            var now = DateTime.UtcNow;
            return payments.FirstOrDefault(p => p.Year == now.Year && p.Month == now.Month)
                   ?? payments.FirstOrDefault();
        }

        public async Task<Payment> ProcessPaymentAsync(ProcessPaymentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                throw new ArgumentException("Citizen ID is required.");
            }

            var existing = await _paymentRepository.GetByCitizenAndPeriodAsync(dto.CitizenId, dto.Year, dto.Month);
            if (existing == null)
            {
                existing = new Payment
                {
                    PaymentId = $"PAY-{dto.Year}{dto.Month:D2}-{dto.CitizenId}",
                    CitizenId = dto.CitizenId,
                    Year = dto.Year,
                    Month = dto.Month,
                    Amount = 50.0,
                    CreatedAt = DateTime.UtcNow
                };
                await _paymentRepository.CreateAsync(existing);
            }

            if (existing.Status == "Paid")
            {
                return existing;
            }

            existing.Status = "Paid";
            existing.PaymentMethod = dto.PaymentMethod;
            existing.PaidAt = DateTime.UtcNow;
            existing.TransactionId = string.IsNullOrWhiteSpace(dto.TransactionId)
                ? $"TXN-{DateTime.UtcNow.Ticks}"
                : dto.TransactionId;

            await _paymentRepository.UpdateAsync(existing);
            return existing;
        }

        public async Task<RazorpayOrderResponseDto> CreateRazorpayOrderAsync(CreateRazorpayOrderDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                throw new ArgumentException("Citizen ID is required.");
            }

            var payment = await _paymentRepository.GetByCitizenAndPeriodAsync(dto.CitizenId, dto.Year, dto.Month);
            if (payment == null)
            {
                payment = new Payment
                {
                    PaymentId = $"PAY-{dto.Year}{dto.Month:D2}-{dto.CitizenId}",
                    CitizenId = dto.CitizenId,
                    Year = dto.Year,
                    Month = dto.Month,
                    Amount = 50.0,
                    Status = "Unpaid",
                    CreatedAt = DateTime.UtcNow
                };
                await _paymentRepository.CreateAsync(payment);
            }

            if (payment.Status == "Paid")
            {
                throw new InvalidOperationException($"Fee for {dto.Month}/{dto.Year} is already paid.");
            }

            int amountInPaise = (int)(payment.Amount * 100);

            var orderRequest = new
            {
                amount = amountInPaise,
                currency = "INR",
                receipt = payment.PaymentId,
                notes = new
                {
                    citizenId = dto.CitizenId,
                    month = dto.Month.ToString(),
                    year = dto.Year.ToString()
                }
            };

            var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders");
            var authBytes = Encoding.ASCII.GetBytes($"{_razorpaySettings.KeyId}:{_razorpaySettings.KeySecret}");
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
            requestMessage.Content = new StringContent(JsonSerializer.Serialize(orderRequest), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(requestMessage);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Razorpay Order Creation Failed: {responseContent}");
            }

            using var doc = JsonDocument.Parse(responseContent);
            string razorpayOrderId = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;

            payment.RazorpayOrderId = razorpayOrderId;
            await _paymentRepository.UpdateAsync(payment);

            return new RazorpayOrderResponseDto
            {
                RazorpayOrderId = razorpayOrderId,
                KeyId = _razorpaySettings.KeyId,
                Amount = amountInPaise,
                Currency = "INR",
                Month = dto.Month,
                Year = dto.Year
            };
        }

        public async Task<Payment> VerifyRazorpayPaymentAsync(VerifyRazorpayPaymentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CitizenId) ||
                string.IsNullOrWhiteSpace(dto.RazorpayOrderId) ||
                string.IsNullOrWhiteSpace(dto.RazorpayPaymentId) ||
                string.IsNullOrWhiteSpace(dto.RazorpaySignature))
            {
                throw new ArgumentException("Invalid Razorpay payment verification payload.");
            }

            // Verify HMAC-SHA256 Signature using Razorpay KeySecret
            string textToHash = $"{dto.RazorpayOrderId}|{dto.RazorpayPaymentId}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_razorpaySettings.KeySecret));
            byte[] hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(textToHash));
            string calculatedSignature = Convert.ToHexString(hashBytes).ToLowerInvariant();

            if (!calculatedSignature.Equals(dto.RazorpaySignature.Trim().ToLowerInvariant(), StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Razorpay payment signature verification failed. Tampering detected.");
            }

            var payment = await _paymentRepository.GetByCitizenAndPeriodAsync(dto.CitizenId, dto.Year, dto.Month);
            if (payment == null)
            {
                payment = new Payment
                {
                    PaymentId = $"PAY-{dto.Year}{dto.Month:D2}-{dto.CitizenId}",
                    CitizenId = dto.CitizenId,
                    Year = dto.Year,
                    Month = dto.Month,
                    Amount = 50.0,
                    CreatedAt = DateTime.UtcNow
                };
                await _paymentRepository.CreateAsync(payment);
            }

            payment.Status = "Paid";
            payment.PaymentMethod = "Online";
            payment.RazorpayOrderId = dto.RazorpayOrderId;
            payment.RazorpayPaymentId = dto.RazorpayPaymentId;
            payment.RazorpaySignature = dto.RazorpaySignature;
            payment.TransactionId = dto.RazorpayPaymentId;
            payment.PaidAt = DateTime.UtcNow;

            await _paymentRepository.UpdateAsync(payment);
            return payment;
        }

        public async Task<Payment> ProcessWorkerPaymentAsync(ProcessWorkerPaymentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                throw new ArgumentException("Citizen ID is required.");
            }

            var payment = await _paymentRepository.GetByCitizenAndPeriodAsync(dto.CitizenId, dto.Year, dto.Month);
            if (payment == null)
            {
                payment = new Payment
                {
                    PaymentId = $"PAY-{dto.Year}{dto.Month:D2}-{dto.CitizenId}",
                    CitizenId = dto.CitizenId,
                    Year = dto.Year,
                    Month = dto.Month,
                    Amount = 50.0,
                    CreatedAt = DateTime.UtcNow
                };
                await _paymentRepository.CreateAsync(payment);
            }

            payment.Status = "Paid";
            payment.PaymentMethod = "Pay Through Worker";
            payment.TransactionId = $"WORKER-{DateTime.UtcNow.Ticks}";
            payment.PaidAt = DateTime.UtcNow;

            await _paymentRepository.UpdateAsync(payment);
            return payment;
        }
    }
}
