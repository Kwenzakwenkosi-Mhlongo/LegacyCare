using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BeneficiaryRequestController : ControllerBase
    {
        private readonly IBeneficiaryRequestService _beneficiaryRequestService;

        public BeneficiaryRequestController(IBeneficiaryRequestService beneficiaryRequestService)
        {
            _beneficiaryRequestService = beneficiaryRequestService;
        }

        // GET: api/BeneficiaryRequest
        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult GetAllRequests()
        {
            return Ok(_beneficiaryRequestService.GetAllRequests());
        }

        // GET: api/BeneficiaryRequest/{requestId}
        [HttpGet("{requestId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult GetRequestById(string requestId)
        {
            try
            {
                return Ok(_beneficiaryRequestService.GetRequestById(requestId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // GET: api/BeneficiaryRequest/policy/{policyId}
        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult GetRequestsByPolicy(string policyId)
        {
            return Ok(_beneficiaryRequestService.GetRequestsByPolicy(policyId));
        }

        // POST: api/BeneficiaryRequest
        [HttpPost]
        public IActionResult CreateRequest([FromBody] BeneficiaryRequest request)
        {
            try
            {
                var createdRequest = _beneficiaryRequestService.CreateRequest(request);
                return CreatedAtAction(
                    nameof(GetRequestById),
                    new { requestId = createdRequest.RequestId },
                    createdRequest);
            }
            catch (DbUpdateException ex)
            {
                return BadRequest(new
                {
                    message = "Database error",
                    details = ex.InnerException?.Message ?? ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    details = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // PUT: api/BeneficiaryRequest/{requestId}/approve
        [HttpPut("{requestId}/approve")]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult ApproveRequest(string requestId)
        {
            try
            {
                _beneficiaryRequestService.ApproveRequest(requestId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/BeneficiaryRequest/{requestId}/reject
        [HttpPut("{requestId}/reject")]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult RejectRequest(string requestId)
        {
            try
            {
                _beneficiaryRequestService.RejectRequest(requestId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/BeneficiaryRequest/{requestId}
        [HttpDelete("{requestId}")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult DeleteRequest(string requestId)
        {
            try
            {
                _beneficiaryRequestService.DeleteRequest(requestId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}