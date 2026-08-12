using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.PaymentManagement;
using System.Security.Claims;

namespace PolicyManagement.Controllers
{
    [Authorize(Roles = "Client")]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentMethodController : ControllerBase
    {
        private readonly IPaymentMethodService _paymentMethodService;

        public PaymentMethodController(IPaymentMethodService paymentMethodService)
        {
            _paymentMethodService = paymentMethodService;
        }

        private string GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("User not authenticated.");

            return userId;
        }

        [HttpPost]
        public IActionResult AddPaymentMethod([FromBody] AddPaymentMethodRequest request)
        {
            try
            {
                var userId = GetUserId();
                var paymentMethod = _paymentMethodService.AddPaymentMethod(userId, request);

                return CreatedAtAction(
                    nameof(GetPaymentMethodById),
                    new { paymentMethodId = paymentMethod.PaymentMethodId },
                    paymentMethod);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{paymentMethodId}")]
        public IActionResult UpdatePaymentMethod(string paymentMethodId,
            [FromBody] UpdatePaymentMethodRequest request)
        {
            try
            {
                var userId = GetUserId();
                var paymentMethod = _paymentMethodService.UpdatePaymentMethod(
                    userId,
                    paymentMethodId,
                    request);

                return Ok(paymentMethod);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{paymentMethodId}")]
        public IActionResult DeletePaymentMethod(string paymentMethodId)
        {
            try
            {
                var userId = GetUserId();
                _paymentMethodService.DeletePaymentMethod(userId, paymentMethodId);

                return Ok("Payment method deleted successfully.");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        public IActionResult GetAllPaymentMethods()
        {
            try
            {
                var userId = GetUserId();
                var paymentMethods = _paymentMethodService.GetAllPaymentMethods(userId);

                return Ok(paymentMethods);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{paymentMethodId}")]
        public IActionResult GetPaymentMethodById(string paymentMethodId)
        {
            try
            {
                var userId = GetUserId();
                var paymentMethod = _paymentMethodService.GetPaymentMethodById(
                    userId,
                    paymentMethodId);

                return Ok(paymentMethod);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}