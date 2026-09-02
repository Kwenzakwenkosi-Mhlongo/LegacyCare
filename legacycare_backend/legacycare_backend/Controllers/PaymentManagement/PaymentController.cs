// File:
// legacycare_backend/legacycare_backend/
// Controllers/PaymentManagement/PaymentController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Service.PaymentManagement;

namespace PolicyManagement.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController(
        IPaymentService paymentService,
        IPaymentScheduleService paymentScheduleService,
        AppDbContext context)
        : BaseController
    {
        private readonly IPaymentService _paymentService =
            paymentService;

        private readonly IPaymentScheduleService _paymentScheduleService =
            paymentScheduleService;

        private readonly AppDbContext _context =
            context;

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

        [HttpGet("{paymentId}/invoice")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetPaymentInvoice(
            string paymentId,
            CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(paymentId))
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Payment ID is required."
                        });
                }

                var payment =
                    await _context.Payment
                        .AsNoTracking()
                        .Where(item =>
                            item.PaymentId == paymentId &&
                            item.Policy.UserId == UserId)
                        .Select(item => new
                        {
                            item.PaymentId,
                            item.Amount,
                            item.DueDate,
                            item.PaymentDate,
                            item.Method,
                            item.Status,
                            item.PolicyId,

                            PackageName =
                                item.Policy.Package != null
                                    ? item.Policy.Package.Name
                                    : string.Empty,

                            PolicyStatus =
                                item.Policy.Status.ToString(),

                            UserId =
                                item.Policy.UserId,

                            FullName =
                                item.Policy.User != null
                                    ? item.Policy.User.FullName
                                    : string.Empty,

                            Email =
                                item.Policy.User != null
                                    ? item.Policy.User.Email
                                    : string.Empty,

                            CellNo =
                                item.Policy.User != null
                                    ? item.Policy.User.CellNo
                                    : string.Empty,

                            Address =
                                item.Policy.User != null
                                    ? item.Policy.User.Address
                                    : string.Empty
                        })
                        .FirstOrDefaultAsync(
                            cancellationToken);

                if (payment == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Payment was not found."
                        });
                }

                if (
                    payment.Status !=
                    PaymentStatus.SUCCESSFUL)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Invoices are only available for successful payments."
                        });
                }

                var client =
                    await _context.Client
                        .AsNoTracking()
                        .Where(item =>
                            item.UserId ==
                            payment.UserId)
                        .Select(item => new
                        {
                            item.ClientId
                        })
                        .FirstOrDefaultAsync(
                            cancellationToken);

                var clientId =
                    client?.ClientId ??
                    string.Empty;

                var displayClientId =
                    int.TryParse(
                        clientId,
                        out var numericClientId)
                        ? $"CL{numericClientId:D3}"
                        : clientId;

                var compactPaymentId =
                    payment.PaymentId
                        .Replace(
                            "-",
                            string.Empty);

                var invoiceReference =
                    compactPaymentId.Length >= 10
                        ? compactPaymentId[..10]
                            .ToUpperInvariant()
                        : compactPaymentId
                            .ToUpperInvariant();

                return Ok(
                    new
                    {
                        paymentId =
                            payment.PaymentId,

                        invoiceReference,

                        amount =
                            payment.Amount,

                        dueDate =
                            payment.DueDate,

                        paymentDate =
                            payment.PaymentDate,

                        method =
                            payment.Method,

                        status =
                            payment.Status,

                        policyId =
                            payment.PolicyId,

                        policyNumber =
                            payment.PolicyId,

                        packageName =
                            string.IsNullOrWhiteSpace(
                                payment.PackageName)
                                ? "Policy Premium"
                                : payment.PackageName,

                        policyStatus =
                            payment.PolicyStatus,

                        clientId,

                        displayClientId,

                        fullName =
                            payment.FullName,

                        email =
                            payment.Email,

                        cellNo =
                            payment.CellNo,

                        address =
                            payment.Address
                    });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[PaymentController] Invoice error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load the payment invoice."
                    });
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