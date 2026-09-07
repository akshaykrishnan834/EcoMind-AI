using EcoMind.API.DTOs;
using EcoMind.API.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EcoMind.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /// <summary>
        /// Get all monthly payments (current + history) for a given citizen
        /// </summary>
        [HttpGet("citizen/{citizenId}")]
        public async Task<IActionResult> GetCitizenPayments(string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId))
            {
                return BadRequest(new { message = "Citizen ID is required." });
            }

            var payments = await _paymentService.GetCitizenMonthlyPaymentsAsync(citizenId);
            return Ok(payments);
        }

        /// <summary>
        /// Get current month payment option for citizen
        /// </summary>
        [HttpGet("current/{citizenId}")]
        public async Task<IActionResult> GetCurrentMonthPayment(string citizenId)
        {
            if (string.IsNullOrWhiteSpace(citizenId))
            {
                return BadRequest(new { message = "Citizen ID is required." });
            }

            var payment = await _paymentService.GetCurrentMonthPaymentAsync(citizenId);
            return Ok(payment);
        }

        /// <summary>
        /// Create a Razorpay Order for monthly fee payment
        /// </summary>
        [HttpPost("create-order")]
        public async Task<IActionResult> CreateRazorpayOrder([FromBody] CreateRazorpayOrderDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                return BadRequest(new { message = "Invalid order creation request." });
            }

            try
            {
                var order = await _paymentService.CreateRazorpayOrderAsync(dto);
                return Ok(order);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Verify Razorpay payment HMAC-SHA256 signature and update payment status to Paid
        /// </summary>
        [HttpPost("verify-signature")]
        public async Task<IActionResult> VerifyRazorpaySignature([FromBody] VerifyRazorpayPaymentDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                return BadRequest(new { message = "Invalid payment verification payload." });
            }

            try
            {
                var payment = await _paymentService.VerifyRazorpayPaymentAsync(dto);
                return Ok(new { success = true, message = "Razorpay payment verified successfully.", payment });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Process cash payment through Haritha Karma Sena worker
        /// </summary>
        [HttpPost("pay-worker")]
        public async Task<IActionResult> ProcessWorkerPayment([FromBody] ProcessWorkerPaymentDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CitizenId))
            {
                return BadRequest(new { message = "Invalid worker payment request." });
            }

            try
            {
                var result = await _paymentService.ProcessWorkerPaymentAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Process monthly fee payment (Generic fallback)
        /// </summary>
        [HttpPost("pay")]
        public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Invalid payment data." });
            }

            try
            {
                var result = await _paymentService.ProcessPaymentAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
