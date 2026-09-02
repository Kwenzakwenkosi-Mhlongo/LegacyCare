// ============================================================
// FILE 8
// Path:
// legacycare_backend/legacycare_backend/
// Controllers/PaymentController.cs
//
// FULL REPLACEMENT
// ============================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Service.PaymentManagement;

namespace PolicyManagement.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController(
        IPaymentService paymentService,
        IPaymentScheduleService paymentScheduleService)
        : BaseController
    {
        private readonly IPaymentService _paymentService =
            paymentService;

        private readonly IPaymentScheduleService _paymentScheduleService =
            paymentScheduleService;

        [HttpGet]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetClientPayments(
            CancellationToken cancellationToken)
        {
            try
            {
                await _paymentScheduleService
                    .GenerateMissingPaymentsForUserAsync(
                        UserId,
                        cancellationToken);

                return Ok(
                    _paymentService.GetPaymentsByUser(
                        UserId));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("history")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetPaymentHistory(
            CancellationToken cancellationToken)
        {
            try
            {
                await _paymentScheduleService
                    .GenerateMissingPaymentsForUserAsync(
                        UserId,
                        cancellationToken);

                return Ok(
                    _paymentService.GetPaymentHistory(
                        UserId));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("outstanding")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetOutstandingPayments(
            CancellationToken cancellationToken)
        {
            try
            {
                await _paymentScheduleService
                    .GenerateMissingPaymentsForUserAsync(
                        UserId,
                        cancellationToken);

                return Ok(
                    _paymentService.GetOutstandingPayments(
                        UserId));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetPaymentsByPolicy(
            string policyId,
            CancellationToken cancellationToken)
        {
            try
            {
                /*
                 * First call enforces the current ownership rule.
                 */
                _paymentService.GetPaymentsByPolicy(
                    UserId,
                    policyId);

                await _paymentScheduleService
                    .GenerateMissingPaymentsForPolicyAsync(
                        policyId,
                        cancellationToken);

                return Ok(
                    _paymentService.GetPaymentsByPolicy(
                        UserId,
                        policyId));
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

        [HttpPost("{paymentId}/select-method")]
        [Authorize(Roles = "Client")]
        public IActionResult SelectMethod(
            string paymentId,
            [FromBody] SelectPaymentMethodRequest request)
        {
            try
            {
                if (request.Method == PaymentMethodType.CASH)
                {
                    return BadRequest(
                        "Cash payments are not supported.");
                }

                /*
                 * Existing GetPaymentById confirms ownership.
                 * Actual persistence should be added to PaymentService.
                 */
                var payment =
                    _paymentService.GetPaymentById(
                        paymentId,
                        UserId);

                payment.SelectPaymentMethod(
                    request.Method);

                return Ok(
                    new
                    {
                        payment.PaymentId,
                        payment.Method,

                        nextStep =
                            request.Method == PaymentMethodType.CARD
                                ? "card"
                                : "eft"
                    });
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
                if (request.Method == PaymentMethodType.CASH)
                {
                    return BadRequest(
                        "Cash payments are not supported.");
                }

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

        [HttpPost("make-payment")]
        [Authorize(Roles = "Client")]
        public IActionResult MakePayment(
            [FromBody] MakePaymentRequest request)
        {
            try
            {
                if (request.Method == PaymentMethodType.CASH)
                {
                    return BadRequest(
                        "Cash payments are not supported.");
                }

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

        [HttpPost("policy/{policyId}/monthly")]
        [Authorize(Roles = "Client")]
        public IActionResult CreateMonthlyPayment(
            string policyId)
        {
            return BadRequest(
                "Monthly premiums are generated automatically.");
        }

        [HttpGet("search")]
        [Authorize(Roles = "Client")]
        public IActionResult SearchPayments(
            [FromQuery] string keyword)
        {
            try
            {
                return Ok(
                    _paymentService.SearchPayments(
                        UserId,
                        keyword));
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
                return Ok(
                    _paymentService.GetPaymentById(
                        paymentId,
                        UserId));
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
                return Ok(
                    _paymentService.GetAllPayments());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("admin/generate-monthly")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateMonthlyPayments(
            CancellationToken cancellationToken)
        {
            try
            {
                var created =
                    await _paymentScheduleService
                        .GenerateMissingPaymentsAsync(
                            cancellationToken);

                return Ok(
                    new
                    {
                        message =
                            "Monthly premium records generated successfully.",

                        created
                    });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}