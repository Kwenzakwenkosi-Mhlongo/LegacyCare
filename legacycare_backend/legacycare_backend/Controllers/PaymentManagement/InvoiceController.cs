using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Service.PaymentManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Client")]
    public class InvoiceController : BaseController
    {
        private readonly IInvoiceService _invoiceService;

        public InvoiceController(IInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        [HttpGet("{invoiceId}")]
        public IActionResult GetInvoiceById(string invoiceId)
        {
            try
            {
                var invoice = _invoiceService.GetInvoiceById(invoiceId, UserId);
                return Ok(invoice);
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

        [HttpGet("payment/{paymentId}")]
        public IActionResult GetInvoiceByPaymentId(string paymentId)
        {
            try
            {
                var invoice = _invoiceService.GetInvoiceByPaymentId(paymentId, UserId);
                return Ok(invoice);
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

        [HttpGet("{invoiceId}/download")]
        public IActionResult DownloadInvoice(string invoiceId)
        {
            try
            {
                var file = _invoiceService.DownloadInvoice(invoiceId, UserId);

                return PhysicalFile(
                    file.FullName,
                    "application/pdf",
                    $"{Path.GetFileName(file.FullName)}");
            }
            catch (FileNotFoundException ex)
            {
                return NotFound(ex.Message);
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

        [HttpPost("payment/{paymentId}")]
        public IActionResult GenerateInvoiceFromPayment(string paymentId)
        {
            try
            {
                var invoice = _invoiceService.GenerateInvoiceFromPayment(paymentId, UserId);
                return CreatedAtAction(
                    nameof(GetInvoiceById),
                    new { invoiceId = invoice.InvoiceId },
                    invoice);
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
    }
}