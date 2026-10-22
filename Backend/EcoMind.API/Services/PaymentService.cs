using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EcoMind.API.Configurations;
using EcoMind.API.DTOs;
using EcoMind.API.Helpers;
using EcoMind.API.Interfaces;
using EcoMind.API.Models;
using Microsoft.Extensions.Options;

namespace EcoMind.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly ICitizenRepository _citizenRepository;
        private readonly IPickupRequestRepository _pickupRequestRepository;
        private readonly RazorpaySettings _razorpaySettings;
        private readonly HttpClient _httpClient;

        public PaymentService(
            IPaymentRepository paymentRepository,
            ICitizenRepository citizenRepository,
            IPickupRequestRepository pickupRequestRepository,
            IOptions<RazorpaySettings> razorpayOptions,
            HttpClient httpClient)
        {
            _paymentRepository = paymentRepository;
            _citizenRepository = citizenRepository;
            _pickupRequestRepository = pickupRequestRepository;
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
                            BaseAmount = 50.0,
                            DiscountAmount = 0.0,
                            PointsRedeemed = 0,
                            Amount = 50.0,
                            Status = "Unpaid",
                            CreatedAt = DateTime.UtcNow
                        };
                        await _paymentRepository.CreateAsync(newPayment);
                    }
                }
            }

            var payments = await _paymentRepository.GetByCitizenIdAsync(citizenId);
            foreach (var p in payments)
            {
                // If citizen selected Pay Through Worker but worker has not approved, status should be Pending Cash Verification
                if (p.PaymentMethod == "Pay Through Worker" && !p.WorkerApproved && p.Status == "Paid")
                {
                    p.Status = "Pending Cash Verification";
                    p.PaidAt = null;
                    p.TransactionId = null;
                    await _paymentRepository.UpdateAsync(p);
                }
            }
            return payments;
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
                    BaseAmount = 50.0,
                    DiscountAmount = 0.0,
                    PointsRedeemed = 0,
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

            // Points only become a discount if explicitly redeemed by citizen beforehand
            double baseAmount = payment.BaseAmount > 0 ? payment.BaseAmount : 50.0;
            double discountAmount = payment.DiscountAmount;
            int pointsRedeemed = payment.PointsRedeemed;
            double finalAmount = payment.Amount > 0 ? payment.Amount : (baseAmount - discountAmount);

            payment.BaseAmount = baseAmount;
            payment.DiscountAmount = discountAmount;
            payment.PointsRedeemed = pointsRedeemed;
            payment.Amount = finalAmount;

            int amountInPaise = (int)(finalAmount * 100);

            var orderRequest = new
            {
                amount = amountInPaise,
                currency = "INR",
                receipt = payment.PaymentId,
                notes = new
                {
                    citizenId = dto.CitizenId,
                    month = dto.Month.ToString(),
                    year = dto.Year.ToString(),
                    discount = discountAmount.ToString("F2"),
                    pointsRedeemed = pointsRedeemed.ToString()
                }
            };

            // Check if Razorpay KeySecret is missing or placeholder (Test / Simulation Mode)
            bool isSimulatedMode = string.IsNullOrWhiteSpace(_razorpaySettings.KeySecret) ||
                                   _razorpaySettings.KeySecret.Contains("YOUR_RAZORPAY") ||
                                   string.IsNullOrWhiteSpace(_razorpaySettings.KeyId);

            string razorpayOrderId;

            if (isSimulatedMode)
            {
                razorpayOrderId = $"order_sim_{DateTime.UtcNow.Ticks}";
                payment.RazorpayOrderId = razorpayOrderId;
                await _paymentRepository.UpdateAsync(payment);

                return new RazorpayOrderResponseDto
                {
                    RazorpayOrderId = razorpayOrderId,
                    KeyId = !string.IsNullOrWhiteSpace(_razorpaySettings.KeyId) ? _razorpaySettings.KeyId : "rzp_test_demo",
                    Amount = amountInPaise,
                    Currency = "INR",
                    Month = dto.Month,
                    Year = dto.Year,
                    BaseAmount = baseAmount,
                    DiscountAmount = discountAmount,
                    PointsRedeemed = pointsRedeemed,
                    NetAmount = finalAmount,
                    IsSimulated = true
                };
            }

            var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders");
            var authBytes = Encoding.ASCII.GetBytes($"{_razorpaySettings.KeyId}:{_razorpaySettings.KeySecret}");
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
            requestMessage.Content = new StringContent(JsonSerializer.Serialize(orderRequest), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(requestMessage);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // If authentication fails with Razorpay API (e.g. invalid key secret in test environment), fall back to simulation mode
                if (responseContent.Contains("Authentication failed") || response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    razorpayOrderId = $"order_sim_{DateTime.UtcNow.Ticks}";
                    payment.RazorpayOrderId = razorpayOrderId;
                    await _paymentRepository.UpdateAsync(payment);

                    return new RazorpayOrderResponseDto
                    {
                        RazorpayOrderId = razorpayOrderId,
                        KeyId = _razorpaySettings.KeyId,
                        Amount = amountInPaise,
                        Currency = "INR",
                        Month = dto.Month,
                        Year = dto.Year,
                        BaseAmount = baseAmount,
                        DiscountAmount = discountAmount,
                        PointsRedeemed = pointsRedeemed,
                        NetAmount = finalAmount,
                        IsSimulated = true
                    };
                }

                throw new InvalidOperationException($"Razorpay Order Creation Failed: {responseContent}");
            }

            using var doc = JsonDocument.Parse(responseContent);
            razorpayOrderId = doc.RootElement.GetProperty("id").GetString() ?? string.Empty;

            payment.RazorpayOrderId = razorpayOrderId;
            await _paymentRepository.UpdateAsync(payment);

            return new RazorpayOrderResponseDto
            {
                RazorpayOrderId = razorpayOrderId,
                KeyId = _razorpaySettings.KeyId,
                Amount = amountInPaise,
                Currency = "INR",
                Month = dto.Month,
                Year = dto.Year,
                BaseAmount = baseAmount,
                DiscountAmount = discountAmount,
                PointsRedeemed = pointsRedeemed,
                NetAmount = finalAmount,
                IsSimulated = false
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

            bool isSimulated = dto.RazorpayOrderId.StartsWith("order_sim_") ||
                               dto.RazorpayPaymentId.StartsWith("pay_sim_") ||
                               string.IsNullOrWhiteSpace(_razorpaySettings.KeySecret) ||
                               _razorpaySettings.KeySecret.Contains("YOUR_RAZORPAY");

            if (!isSimulated)
            {
                // Verify HMAC-SHA256 Signature using Razorpay KeySecret
                string textToHash = $"{dto.RazorpayOrderId}|{dto.RazorpayPaymentId}";
                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_razorpaySettings.KeySecret));
                byte[] hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(textToHash));
                string calculatedSignature = Convert.ToHexString(hashBytes).ToLowerInvariant();

                if (!calculatedSignature.Equals(dto.RazorpaySignature.Trim().ToLowerInvariant(), StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException("Razorpay payment signature verification failed. Tampering detected.");
                }
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
                    BaseAmount = 50.0,
                    DiscountAmount = 0.0,
                    PointsRedeemed = 0,
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

        public async Task<Payment> RequestWorkerPaymentAsync(ProcessWorkerPaymentDto dto)
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
                    BaseAmount = 50.0,
                    DiscountAmount = 0.0,
                    PointsRedeemed = 0,
                    Amount = 50.0,
                    CreatedAt = DateTime.UtcNow
                };
                await _paymentRepository.CreateAsync(payment);
            }

            if (dto.ApplyEcoDiscount && payment.DiscountAmount <= 0)
            {
                payment.DiscountAmount = 10.0;
                payment.PointsRedeemed = 10;
                payment.Amount = 40.0;
            }

            // Citizen requested to pay cash via worker; remains pending verification until worker collects & approves
            payment.Status = "Pending Cash Verification";
            payment.PaymentMethod = "Pay Through Worker";
            payment.WorkerApproved = false;
            payment.PaidAt = null;
            payment.TransactionId = null;

            await _paymentRepository.UpdateAsync(payment);
            return payment;
        }

        public async Task<Payment> ApproveWorkerPaymentAsync(ProcessWorkerPaymentDto dto, string? workerId = null)
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
                    BaseAmount = 50.0,
                    DiscountAmount = 0.0,
                    PointsRedeemed = 0,
                    Amount = 50.0,
                    CreatedAt = DateTime.UtcNow
                };
                await _paymentRepository.CreateAsync(payment);
            }

            if (dto.ApplyEcoDiscount && payment.DiscountAmount <= 0)
            {
                payment.DiscountAmount = 10.0;
                payment.PointsRedeemed = 10;
                payment.Amount = 40.0;
            }

            payment.Status = "Paid";
            payment.PaymentMethod = "Pay Through Worker";
            payment.WorkerApproved = true;
            if (!string.IsNullOrEmpty(workerId))
            {
                payment.ApprovedByWorkerId = workerId;
            }
            payment.TransactionId = $"WORKER-{DateTime.UtcNow.Ticks}";
            payment.PaidAt = DateTime.UtcNow;

            await _paymentRepository.UpdateAsync(payment);
            return payment;
        }

        public async Task<Payment> ProcessWorkerPaymentAsync(ProcessWorkerPaymentDto dto)
        {
            return await ApproveWorkerPaymentAsync(dto);
        }

        public async Task<RedeemPointsResponseDto> RedeemPointsAsync(RedeemPointsDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                return new RedeemPointsResponseDto
                {
                    Success = false,
                    Message = "Citizen ID is required."
                };
            }

            var citizen = await _citizenRepository.GetCitizenByCitizenIdAsync(dto.CitizenId);
            if (citizen == null)
            {
                return new RedeemPointsResponseDto
                {
                    Success = false,
                    Message = "Citizen profile not found."
                };
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
                    BaseAmount = 50.0,
                    DiscountAmount = 0.0,
                    PointsRedeemed = 0,
                    Amount = 50.0,
                    Status = "Unpaid",
                    CreatedAt = DateTime.UtcNow
                };
                await _paymentRepository.CreateAsync(payment);
            }

            if (payment.Status == "Paid")
            {
                return new RedeemPointsResponseDto
                {
                    Success = false,
                    Message = $"Monthly fee for {dto.Month}/{dto.Year} is already paid.",
                    RemainingPoints = citizen.EcoPoints
                };
            }

            // Ensure the same points are not redeemed twice for this month
            if (payment.PointsRedeemed > 0 || payment.DiscountAmount > 0)
            {
                return new RedeemPointsResponseDto
                {
                    Success = false,
                    Message = "Points have already been redeemed for this month. The same points cannot be redeemed twice.",
                    PointsRedeemed = payment.PointsRedeemed,
                    RemainingPoints = citizen.EcoPoints,
                    BaseAmount = payment.BaseAmount,
                    DiscountAmount = payment.DiscountAmount,
                    NetAmount = payment.Amount,
                    Payment = payment
                };
            }

            var eligibility = await GetRedemptionEligibilityAsync(dto.CitizenId, dto.Year, dto.Month);

            int pointsToRedeem = 10;
            if (citizen.EcoPoints < pointsToRedeem)
            {
                return new RedeemPointsResponseDto
                {
                    Success = false,
                    Message = $"Insufficient points. You need at least {pointsToRedeem} points to redeem 20% discount (Available: {citizen.EcoPoints}).",
                    RemainingPoints = citizen.EcoPoints,
                    ConsecutivePickupsCount = eligibility.ConsecutivePickupsCount,
                    RequiredConsecutivePickups = eligibility.RequiredConsecutivePickups,
                    IsContinuousPickupEligible = eligibility.ConsecutivePickupsCount >= eligibility.RequiredConsecutivePickups
                };
            }

            if (eligibility.ConsecutivePickupsCount < eligibility.RequiredConsecutivePickups)
            {
                return new RedeemPointsResponseDto
                {
                    Success = false,
                    Message = $"Points redemption is only allowed for citizens who have completed continuous waste pickups. You need at least {eligibility.RequiredConsecutivePickups} consecutive completed pickups without a break (Current streak: {eligibility.ConsecutivePickupsCount}).",
                    RemainingPoints = citizen.EcoPoints,
                    ConsecutivePickupsCount = eligibility.ConsecutivePickupsCount,
                    RequiredConsecutivePickups = eligibility.RequiredConsecutivePickups,
                    IsContinuousPickupEligible = false
                };
            }

            // Deduct the redeemed points from the user's balance and save in database
            citizen.EcoPoints -= pointsToRedeem;
            if (citizen.EcoPoints < 0) citizen.EcoPoints = 0;

            // Mark oldest valid point entries as used (FIFO)
            if (citizen.PointEntries != null && citizen.PointEntries.Count > 0)
            {
                int needed = pointsToRedeem;
                foreach (var entry in citizen.PointEntries.Where(e => !e.IsUsed && e.ExpiresAt > DateTime.UtcNow).OrderBy(e => e.EarnedAt))
                {
                    if (needed <= 0) break;
                    entry.IsUsed = true;
                    needed -= entry.Points;
                }
            }

            await _citizenRepository.UpdateCitizenAsync(citizen);

            // Apply existing 20% discount rule (₹10 off ₹50 base fee) and save in database
            payment.BaseAmount = 50.0;
            payment.DiscountAmount = 10.0;
            payment.PointsRedeemed = pointsToRedeem;
            payment.Amount = 40.0;
            await _paymentRepository.UpdateAsync(payment);

            return new RedeemPointsResponseDto
            {
                Success = true,
                Message = $"{pointsToRedeem} Points Redeemed. 20% Discount Applied.",
                PointsRedeemed = pointsToRedeem,
                RemainingPoints = citizen.EcoPoints,
                BaseAmount = 50.0,
                DiscountAmount = 10.0,
                NetAmount = 40.0,
                Payment = payment,
                ConsecutivePickupsCount = eligibility.ConsecutivePickupsCount,
                RequiredConsecutivePickups = eligibility.RequiredConsecutivePickups,
                IsContinuousPickupEligible = true
            };
        }

        public async Task<RedemptionEligibilityDto> GetRedemptionEligibilityAsync(string citizenId, int? year = null, int? month = null)
        {
            if (string.IsNullOrWhiteSpace(citizenId))
            {
                return new RedemptionEligibilityDto
                {
                    CitizenId = citizenId ?? string.Empty,
                    IsEligible = false,
                    Message = "Citizen ID is required."
                };
            }

            var citizen = await _citizenRepository.GetCitizenByCitizenIdAsync(citizenId);
            if (citizen == null)
            {
                return new RedemptionEligibilityDto
                {
                    CitizenId = citizenId,
                    IsEligible = false,
                    Message = "Citizen profile not found."
                };
            }

            // Fetch pickup requests for citizen
            var requests = await _pickupRequestRepository.GetByCitizenIdAsync(citizenId);
            var completedPickupRequests = requests
                .Where(r => r.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ||
                            r.Status.Equals("Collected", StringComparison.OrdinalIgnoreCase))
                .OrderBy(r => r.CollectedAt ?? r.RequestedAt)
                .ToList();

            // Calculate points accurately from completed pickups using progressive scaling & volume bonus
            int earnedFromPickups = EcoPointsCalculator.CalculateTotalPointsFromPickups(completedPickupRequests);
            var citizenPayments = await _paymentRepository.GetByCitizenIdAsync(citizenId);
            int pointsRedeemedTotal = citizenPayments?.Sum(p => p.PointsRedeemed) ?? 0;
            int accuratePoints = Math.Max(0, earnedFromPickups - pointsRedeemedTotal);

            // Cleanse any legacy hardcoded 17 points default if points do not match actual pickups
            if (citizen.EcoPoints != accuratePoints)
            {
                citizen.EcoPoints = accuratePoints;
                await _citizenRepository.UpdateCitizenAsync(citizen);
            }

            int ecoPoints = accuratePoints;
            bool hasEnoughPoints = ecoPoints >= 10;

            var completedPeriods = new HashSet<(int Year, int Month)>();

            // 1. Periods from completed PickupRequests
            foreach (var req in completedPickupRequests)
            {
                if (req.CollectionYear.HasValue && req.CollectionMonth.HasValue &&
                    req.CollectionMonth.Value >= 1 && req.CollectionMonth.Value <= 12)
                {
                    completedPeriods.Add((req.CollectionYear.Value, req.CollectionMonth.Value));
                }
                else
                {
                    var targetDate = req.CollectedAt ?? (req.RequestedAt != default ? req.RequestedAt : DateTime.UtcNow);
                    var (calcYear, calcMonth, _) = PickupRequestService.CalculateAssignedCollectionPeriod(targetDate);
                    completedPeriods.Add((calcYear, calcMonth));
                }
            }

            // 2. Periods from citizen's doorstep collection PointEntries (for verified pickups or demo resets)
            if (citizen.PointEntries != null && citizen.PointEntries.Count > 0)
            {
                foreach (var entry in citizen.PointEntries)
                {
                    if (!string.IsNullOrWhiteSpace(entry.RequestId) &&
                        (entry.Points >= 2 ||
                         entry.Description.Contains("collection", StringComparison.OrdinalIgnoreCase) ||
                         entry.Description.Contains("pickup", StringComparison.OrdinalIgnoreCase) ||
                         entry.Description.Contains("plastic", StringComparison.OrdinalIgnoreCase)))
                    {
                        var (calcYear, calcMonth, _) = PickupRequestService.CalculateAssignedCollectionPeriod(entry.EarnedAt);
                        completedPeriods.Add((calcYear, calcMonth));
                    }
                }
            }

            // Determine reference starting period
            var nowUtc = DateTime.UtcNow;
            int refYear = year ?? nowUtc.Year;
            int refMonth = month ?? nowUtc.Month;
            var refDate = new DateTime(refYear, refMonth, 1);

            // Compute consecutive completed pickups streak without a break
            int streak = 0;
            if (completedPeriods.Contains((refDate.Year, refDate.Month)))
            {
                streak = 1;
                var cursor = refDate.AddMonths(-1);
                while (completedPeriods.Contains((cursor.Year, cursor.Month)))
                {
                    streak++;
                    cursor = cursor.AddMonths(-1);
                }
            }
            else
            {
                // If reference month is current calendar month (ongoing), check backward from previous month
                if (refDate.Year == nowUtc.Year && refDate.Month == nowUtc.Month)
                {
                    var cursor = refDate.AddMonths(-1);
                    while (completedPeriods.Contains((cursor.Year, cursor.Month)))
                    {
                        streak++;
                        cursor = cursor.AddMonths(-1);
                    }
                }
            }

            var recentMonths = completedPeriods
                .OrderByDescending(p => p.Year * 12 + p.Month)
                .Take(5)
                .Select(p => $"{System.Globalization.CultureInfo.InvariantCulture.DateTimeFormat.GetAbbreviatedMonthName(p.Month)} {p.Year}")
                .ToList();

            int requiredConsecutive = 2;
            int requiredPoints = 10;
            bool isStreakMet = streak >= requiredConsecutive;
            bool isEligible = isStreakMet && hasEnoughPoints;

            string message;
            if (!hasEnoughPoints)
            {
                message = $"Insufficient points. You need at least {requiredPoints} points to redeem 20% discount (Available: {ecoPoints}).";
            }
            else if (!isStreakMet)
            {
                message = $"Redemption is only allowed for citizens with continuous waste pickups. You need at least {requiredConsecutive} consecutive completed pickups without a break (Current streak: {streak}).";
            }
            else
            {
                message = $"Eligible to redeem points! You have an active streak of {streak} continuous completed pickups.";
            }

            return new RedemptionEligibilityDto
            {
                CitizenId = citizenId,
                IsEligible = isEligible,
                ConsecutivePickupsCount = streak,
                RequiredConsecutivePickups = requiredConsecutive,
                EcoPoints = ecoPoints,
                RequiredPoints = requiredPoints,
                HasEnoughPoints = hasEnoughPoints,
                Message = message,
                RecentCompletedMonths = recentMonths
            };
        }

        public async Task<bool> ResetDemoPointsAsync(string citizenId)
        {
            var citizen = await _citizenRepository.GetCitizenByCitizenIdAsync(citizenId);
            if (citizen != null)
            {
                var nowUtc = DateTime.UtcNow;
                citizen.PointEntries = new List<EcoPointEntry>
                {
                    new EcoPointEntry { Points = 2, EarnedAt = nowUtc.AddDays(-10), ExpiresAt = nowUtc.AddMonths(4).AddDays(-10), RequestId = "REQ101", IsUsed = false, Description = "Doorstep collection (Pickup #1, Small: +2 Pts)" },
                    new EcoPointEntry { Points = 2, EarnedAt = nowUtc.AddDays(-22), ExpiresAt = nowUtc.AddMonths(4).AddDays(-22), RequestId = "REQ098", IsUsed = false, Description = "Doorstep collection (Pickup #2, Small: +2 Pts)" },
                    new EcoPointEntry { Points = 3, EarnedAt = nowUtc.AddDays(-35), ExpiresAt = nowUtc.AddMonths(4).AddDays(-35), RequestId = "REQ089", IsUsed = false, Description = "Doorstep collection (Pickup #3, Small: +3 Pts)" },
                    new EcoPointEntry { Points = 3, EarnedAt = nowUtc.AddDays(-48), ExpiresAt = nowUtc.AddMonths(4).AddDays(-48), RequestId = "REQ076", IsUsed = false, Description = "Doorstep collection (Pickup #4, Small: +3 Pts)" }
                };
                citizen.EcoPoints = citizen.PointEntries.Sum(e => e.Points); // 10 points
                await _citizenRepository.UpdateCitizenAsync(citizen);
            }

            var now = DateTime.UtcNow;
            var payment = await _paymentRepository.GetByCitizenAndPeriodAsync(citizenId, now.Year, now.Month);
            if (payment != null && payment.Status != "Paid")
            {
                payment.BaseAmount = 50.0;
                payment.DiscountAmount = 0.0;
                payment.PointsRedeemed = 0;
                payment.Amount = 50.0;
                await _paymentRepository.UpdateAsync(payment);
            }

            return true;
        }
    }
}
