// ============================================================
// File: Controllers/PaymentController.cs
// ============================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.PaymentManagement;

namespace PolicyManagement.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController(
        IPaymentService paymentService) : BaseController
    {
        private readonly IPaymentService _paymentService = paymentService;

        [HttpGet]
        [Authorize(Roles = "Client")]
        public IActionResult GetClientPayments()
        {
            try
            {
                var payments =
                    _paymentService.GetPaymentsByUser(
                        UserId);

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("history")]
        [Authorize(Roles = "Client")]
        public IActionResult GetPaymentHistory()
        {
            try
            {
                var payments =
                    _paymentService.GetPaymentHistory(
                        UserId);

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("outstanding")]
        [Authorize(Roles = "Client")]
        public IActionResult GetOutstandingPayments()
        {
            try
            {
                var payments =
                    _paymentService.GetOutstandingPayments(
                        UserId);

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Client")]
        public IActionResult GetPaymentsByPolicy(
            string policyId)
        {
            try
            {
                var payments =
                    _paymentService.GetPaymentsByPolicy(
                        UserId,
                        policyId);

                return Ok(payments);
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

        [HttpPost("make-payment")]
        [Authorize(Roles = "Client")]
        public IActionResult MakePayment(
            [FromBody] MakePaymentRequest request)
        {
            try
            {
                var payment =
                    _paymentService.MakePayment(
                        UserId,
                        request);

                return CreatedAtAction(
                    nameof(GetPaymentById),
                    new
                    {
                        paymentId =
                            payment.PaymentId
                    },
                    payment);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{paymentId}/confirm")]
        [Authorize(Roles = "Client")]
        public IActionResult ConfirmPayment(
            string paymentId,
            [FromBody] ConfirmPaymentRequest request)
        {
            try
            {
                var payment =
                    _paymentService.ConfirmPayment(
                        paymentId,
                        UserId,
                        request.Method);

                return Ok(payment);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("policy/{policyId}/monthly")]
        [Authorize(Roles = "Client")]
        public IActionResult CreateMonthlyPayment(
            string policyId)
        {
            try
            {
                var payment =
                    _paymentService.CreateMonthlyPayment(
                        policyId,
                        UserId);

                return CreatedAtAction(
                    nameof(GetPaymentById),
                    new
                    {
                        paymentId =
                            payment.PaymentId
                    },
                    payment);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("search")]
        [Authorize(Roles = "Client")]
        public IActionResult SearchPayments(
            [FromQuery] string keyword)
        {
            try
            {
                var payments =
                    _paymentService.SearchPayments(
                        UserId,
                        keyword);

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{paymentId}")]
        [Authorize(Roles = "Client")]
        public IActionResult GetPaymentById(
            string paymentId)
        {
            try
            {
                var payment =
                    _paymentService.GetPaymentById(
                        paymentId,
                        UserId);

                return Ok(payment);
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

        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetAllPaymentsForAdmin()
        {
            try
            {
                var payments =
                    _paymentService.GetAllPayments();

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("admin/generate-monthly")]
        [Authorize(Roles = "Admin")]
        public IActionResult GenerateMonthlyPayments()
        {
            try
            {
                _paymentService
                    .GenerateMonthlyPaymentsForAllPolicies();

                return Ok(
                    new
                    {
                        message =
                            "30-day payment records generated successfully."
                    });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}