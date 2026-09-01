// ============================================================
// File: Controllers/PackageChangeRequestController.cs
// ============================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PackageChangeRequestController :
        BaseController
    {
        private readonly IPackageChangeRequestService
            _requestService;

        public PackageChangeRequestController(
            IPackageChangeRequestService requestService)
        {
            _requestService = requestService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetAllRequests()
        {
            return Ok(
                _requestService.GetAllRequests());
        }

        [HttpGet("{requestId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetRequestById(
            string requestId)
        {
            try
            {
                return Ok(
                    _requestService.GetRequestById(
                        requestId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetRequestsByPolicy(
            string policyId)
        {
            try
            {
                return Ok(
                    _requestService.GetRequestsByPolicy(
                        policyId));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("client/policy/{policyId}")]
        [Authorize(Roles = "Client")]
        public IActionResult GetClientRequestsByPolicy(
            string policyId)
        {
            try
            {
                return Ok(
                    _requestService
                        .GetRequestsByPolicyForClient(
                            policyId,
                            UserId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Client")]
        public IActionResult CreateRequest(
            [FromBody] ChangePackageRequest request)
        {
            try
            {
                var created =
                    _requestService.CreateRequest(
                        request,
                        UserId);

                return Ok(created);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{requestId}/approve")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult ApproveRequest(
            string requestId)
        {
            try
            {
                _requestService.ApproveRequest(
                    requestId);

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

        [HttpPut("{requestId}/reject")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult RejectRequest(
            string requestId)
        {
            try
            {
                _requestService.RejectRequest(
                    requestId);

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

        [HttpDelete("{requestId}")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult DeleteRequest(
            string requestId)
        {
            try
            {
                _requestService.DeleteRequest(
                    requestId);

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}

