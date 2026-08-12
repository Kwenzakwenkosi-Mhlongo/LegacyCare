using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PackageChangeRequestController : ControllerBase
    {
        private readonly IPackageChangeRequestService _requestService;

        public PackageChangeRequestController(IPackageChangeRequestService requestService)
        {
            _requestService = requestService;
        }

        // GET: api/PackageChangeRequest
        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult GetAllRequests()
        {
            return Ok(_requestService.GetAllRequests());
        }

        // GET: api/PackageChangeRequest/{requestId}
        [HttpGet("{requestId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult GetRequestById(string requestId)
        {
            try
            {
                return Ok(_requestService.GetRequestById(requestId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // GET: api/PackageChangeRequest/policy/{policyId}
        [HttpGet("policy/{policyId}")]
        public IActionResult GetRequestsByPolicy(string policyId)
        {
            return Ok(_requestService.GetRequestsByPolicy(policyId));
        }

        // POST: api/PackageChangeRequest
        [HttpPost]
        public IActionResult CreateRequest([FromBody] ChangePackageRequest request)
        {
            try
            {
                var created = _requestService.CreateRequest(request);
                return CreatedAtAction(
                    nameof(GetRequestById),
                    new { requestId = created.RequestId },
                    created);
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

        // PUT: api/PackageChangeRequest/{requestId}/approve
        [HttpPut("{requestId}/approve")]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult ApproveRequest(string requestId)
        {
            try
            {
                _requestService.ApproveRequest(requestId);
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

        // PUT: api/PackageChangeRequest/{requestId}/reject
        [HttpPut("{requestId}/reject")]
        [Authorize(Roles = "Admin,Staff,Clerk")]  // ← ADD Clerk
        public IActionResult RejectRequest(string requestId)
        {
            try
            {
                _requestService.RejectRequest(requestId);
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

        // DELETE: api/PackageChangeRequest/{requestId}
        [HttpDelete("{requestId}")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult DeleteRequest(string requestId)
        {
            try
            {
                _requestService.DeleteRequest(requestId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}