
// ============================================================================
// File: Controllers/BeneficiaryRequestController.cs
// ============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BeneficiaryRequestController : BaseController
    {
        private readonly IBeneficiaryRequestService
            _beneficiaryRequestService;

        public BeneficiaryRequestController(
            IBeneficiaryRequestService beneficiaryRequestService)
        {
            _beneficiaryRequestService =
                beneficiaryRequestService;
        }

        // ====================================================================
        // GET ALL
        // GET: /api/BeneficiaryRequest
        // ====================================================================

        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetAllRequests()
        {
            try
            {
                return Ok(
                    _beneficiaryRequestService
                        .GetAllRequests());
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] GetAllRequests error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ====================================================================
        // GET BY ID
        // GET: /api/BeneficiaryRequest/{requestId}
        // ====================================================================

        [HttpGet("{requestId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetRequestById(
            string requestId)
        {
            try
            {
                return Ok(
                    _beneficiaryRequestService
                        .GetRequestById(
                            requestId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] GetRequestById error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ====================================================================
        // GET REQUESTS BY POLICY - STAFF
        // GET: /api/BeneficiaryRequest/policy/{policyId}
        // ====================================================================

        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetRequestsByPolicy(
            string policyId)
        {
            try
            {
                return Ok(
                    _beneficiaryRequestService
                        .GetRequestsByPolicy(
                            policyId));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] GetRequestsByPolicy error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ====================================================================
        // GET REQUESTS BY POLICY - CLIENT
        // GET: /api/BeneficiaryRequest/client/policy/{policyId}
        // ====================================================================

        [HttpGet("client/policy/{policyId}")]
        [Authorize(Roles = "Client")]
        public IActionResult GetClientRequestsByPolicy(
            string policyId)
        {
            try
            {
                return Ok(
                    _beneficiaryRequestService
                        .GetRequestsByPolicyForClient(
                            policyId,
                            UserId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] GetClientRequestsByPolicy error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ====================================================================
        // CREATE
        // POST: /api/BeneficiaryRequest
        // ====================================================================

        [HttpPost]
        [Authorize(Roles = "Client")]
        public IActionResult CreateRequest(
            [FromBody] CreateBeneficiaryRequestRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Beneficiary request information is required."
                        }
                    );
                }

                if (string.IsNullOrWhiteSpace(
                    request.PolicyId))
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Policy ID is required."
                        }
                    );
                }

                var beneficiaryRequest =
                    new BeneficiaryRequest
                    {
                        PolicyId =
                            request.PolicyId.Trim(),

                        RequestType =
                            request.RequestType,

                        Description =
                            string.IsNullOrWhiteSpace(
                                request.Description)
                                ? null
                                : request.Description.Trim(),

                        BeneficiaryId =
                            string.IsNullOrWhiteSpace(
                                request.BeneficiaryId)
                                ? null
                                : request.BeneficiaryId.Trim(),

                        FullName =
                            string.IsNullOrWhiteSpace(
                                request.FullName)
                                ? null
                                : request.FullName.Trim(),

                        Relationship =
                            request.Relationship,

                        IDNumber =
                            string.IsNullOrWhiteSpace(
                                request.IDNumber)
                                ? null
                                : request.IDNumber.Trim(),

                        DateOfBirth =
                            request.DateOfBirth,

                        Gender =
                            string.IsNullOrWhiteSpace(
                                request.Gender)
                                ? null
                                : request.Gender.Trim()
                    };

                var created =
                    _beneficiaryRequestService
                        .CreateRequest(
                            beneficiaryRequest,
                            UserId);

                return CreatedAtAction(
                    nameof(GetRequestById),
                    new
                    {
                        requestId =
                            created.RequestId
                    },
                    created
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] CreateRequest error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ====================================================================
        // APPROVE
        // PUT: /api/BeneficiaryRequest/{requestId}/approve
        // ====================================================================

        [HttpPut("{requestId}/approve")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult ApproveRequest(
            string requestId)
        {
            try
            {
                _beneficiaryRequestService
                    .ApproveRequest(
                        requestId);

                return Ok(
                    new
                    {
                        message =
                            "Beneficiary request approved successfully."
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] ApproveRequest error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ====================================================================
        // REJECT
        // PUT: /api/BeneficiaryRequest/{requestId}/reject
        // ====================================================================

        [HttpPut("{requestId}/reject")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult RejectRequest(
            string requestId)
        {
            try
            {
                _beneficiaryRequestService
                    .RejectRequest(
                        requestId);

                return Ok(
                    new
                    {
                        message =
                            "Beneficiary request rejected successfully."
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] RejectRequest error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ====================================================================
        // DELETE
        // DELETE: /api/BeneficiaryRequest/{requestId}
        // ====================================================================

        [HttpDelete("{requestId}")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult DeleteRequest(
            string requestId)
        {
            try
            {
                _beneficiaryRequestService
                    .DeleteRequest(
                        requestId);

                return Ok(
                    new
                    {
                        message =
                            "Beneficiary request deleted successfully."
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[BeneficiaryRequestController] DeleteRequest error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }
    }
}