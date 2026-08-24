using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.DTOs.Responses;
using PolicyManagement.Enums;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;
using System.Security.Claims;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PolicyController : ControllerBase
    {
        private readonly IPolicyService _policyService;

        public PolicyController(IPolicyService policyService)
        {
            _policyService = policyService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetAllPolicies()
        {
            try
            {
                var policies = _policyService.GetAllPolicies();

                var response = policies.Select(p => new PolicyResponse
                {
                    PolicyId = p.PolicyId,
                    UserId = p.UserId,
                    ClientName = p.User?.FullName ?? "N/A",
                    PackageId = p.PackageId,
                    PackageName = p.Package?.Name ?? "N/A",
                    MonthlyPremium = p.Package?.MonthlyPremium ?? 0,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Status = p.Status,
                    Beneficiaries = p.Beneficiaries?.Select(b => new BeneficiaryResponse
                    {
                        BeneficiaryId = b.BeneficiaryId,
                        FullName = b.FullName,
                        IDNumber = b.IDNumber,
                        Relationship = b.Relationship,
                        Status = b.Status
                    }).ToList() ?? new List<BeneficiaryResponse>()
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("client")]
[Authorize]
public IActionResult GetClientPolicies()
{
    try
    {
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("userId")?.Value;

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new
            {
                message = "Unable to determine the logged-in client."
            });
        }

        var policies = _policyService.GetPoliciesByUser(userId);

        var response = policies.Select(p => new PolicyResponse
        {
            PolicyId = p.PolicyId,

            UserId = p.UserId,

            ClientName = p.User?.FullName ?? "N/A",

            PackageId = p.PackageId,

            PackageName = p.Package?.Name ?? "N/A",

            MonthlyPremium =
                p.Package?.MonthlyPremium ?? 0,

            StartDate = p.StartDate,

            EndDate = p.EndDate,

            Status = p.Status,

            Beneficiaries = p.Beneficiaries?
                .Select(b => new BeneficiaryResponse
                {
                    BeneficiaryId = b.BeneficiaryId,

                    FullName = b.FullName,

                    IDNumber = b.IDNumber,

                    Relationship = b.Relationship,

                    Status = b.Status
                })
                .ToList()
                ?? new List<BeneficiaryResponse>()
        });

        return Ok(response);
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}

        [HttpGet("{policyId}")]
        public IActionResult GetPolicyById(string policyId)
        {
            try
            {
                var policy = _policyService.GetPolicyById(policyId);

                var response = new PolicyResponse
                {
                    PolicyId = policy.PolicyId,
                    UserId = policy.UserId,
                    ClientName = policy.User?.FullName ?? "N/A",
                    PackageId = policy.PackageId,
                    PackageName = policy.Package?.Name ?? "N/A",
                    MonthlyPremium = policy.Package?.MonthlyPremium ?? 0,
                    StartDate = policy.StartDate,
                    EndDate = policy.EndDate,
                    Status = policy.Status,
                    Beneficiaries = policy.Beneficiaries?.Select(b => new BeneficiaryResponse
                    {
                        BeneficiaryId = b.BeneficiaryId,
                        FullName = b.FullName,
                        IDNumber = b.IDNumber,
                        Relationship = b.Relationship,
                        Status = b.Status
                    }).ToList() ?? new List<BeneficiaryResponse>()
                };

                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetPoliciesByUser(string userId)
        {
            try
            {
                var policies = _policyService.GetPoliciesByUser(userId);

                var response = policies.Select(p => new PolicyResponse
                {
                    PolicyId = p.PolicyId,
                    UserId = p.UserId,
                    ClientName = p.User?.FullName ?? "N/A",
                    PackageId = p.PackageId,
                    PackageName = p.Package?.Name ?? "N/A",
                    MonthlyPremium = p.Package?.MonthlyPremium ?? 0,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Status = p.Status,
                    Beneficiaries = p.Beneficiaries?.Select(b => new BeneficiaryResponse
                    {
                        BeneficiaryId = b.BeneficiaryId,
                        FullName = b.FullName,
                        IDNumber = b.IDNumber,
                        Relationship = b.Relationship,
                        Status = b.Status
                    }).ToList() ?? new List<BeneficiaryResponse>()
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult CreatePolicy([FromBody] CreatePolicyRequest request)
        {
            try
            {
                var policy = new Policy
                {
                    UserId = request.UserId,
                    PackageId = request.PackageId,
                    StartDate = request.StartDate
                };

                var createdPolicy = _policyService.CreatePolicy(policy);

                foreach (var beneficiaryDto in request.Beneficiaries)
                {
                    var beneficiary = new Beneficiary
                    {
                        FullName = beneficiaryDto.FullName,
                        IDNumber = beneficiaryDto.IDNumber,
                        Relationship = (BeneficiaryRelationship)beneficiaryDto.Relationship,
                        PolicyId = createdPolicy.PolicyId
                    };
                    _policyService.AddBeneficiary(createdPolicy.PolicyId, beneficiary);
                }

                var response = new PolicyResponse
                {
                    PolicyId = createdPolicy.PolicyId,
                    UserId = createdPolicy.UserId,
                    ClientName = createdPolicy.User?.FullName ?? "N/A",
                    PackageId = createdPolicy.PackageId,
                    PackageName = createdPolicy.Package?.Name ?? "N/A",
                    MonthlyPremium = createdPolicy.Package?.MonthlyPremium ?? 0,
                    StartDate = createdPolicy.StartDate,
                    EndDate = createdPolicy.EndDate,
                    Status = createdPolicy.Status,
                    Beneficiaries = createdPolicy.Beneficiaries?.Select(b => new BeneficiaryResponse
                    {
                        BeneficiaryId = b.BeneficiaryId,
                        FullName = b.FullName,
                        IDNumber = b.IDNumber,
                        Relationship = b.Relationship,
                        Status = b.Status
                    }).ToList() ?? new List<BeneficiaryResponse>()
                };

                return CreatedAtAction(
                    nameof(GetPolicyById),
                    new { policyId = createdPolicy.PolicyId },
                    response);
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

        [HttpPut("{policyId}")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult UpdatePolicy(string policyId, [FromBody] UpdatePolicyRequest request)
        {
            try
            {
                var policy = new Policy
                {
                    StartDate = request.StartDate
                };
                var updatedPolicy = _policyService.UpdatePolicy(policyId, policy);

                var response = new PolicyResponse
                {
                    PolicyId = updatedPolicy.PolicyId,
                    UserId = updatedPolicy.UserId,
                    ClientName = updatedPolicy.User?.FullName ?? "N/A",
                    PackageId = updatedPolicy.PackageId,
                    PackageName = updatedPolicy.Package?.Name ?? "N/A",
                    MonthlyPremium = updatedPolicy.Package?.MonthlyPremium ?? 0,
                    StartDate = updatedPolicy.StartDate,
                    EndDate = updatedPolicy.EndDate,
                    Status = updatedPolicy.Status,
                    Beneficiaries = updatedPolicy.Beneficiaries?.Select(b => new BeneficiaryResponse
                    {
                        BeneficiaryId = b.BeneficiaryId,
                        FullName = b.FullName,
                        IDNumber = b.IDNumber,
                        Relationship = b.Relationship,
                        Status = b.Status
                    }).ToList() ?? new List<BeneficiaryResponse>()
                };

                return Ok(response);
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

        [HttpPut("{policyId}/status")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult UpdatePolicyStatus(string policyId, [FromBody] PolicyStatus status)
        {
            try
            {
                _policyService.UpdatePolicyStatus(policyId, status);
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

        [HttpPut("{policyId}/activate")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult ActivatePolicy(string policyId)
        {
            try
            {
                _policyService.ActivatePolicy(policyId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{policyId}/cancel")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult CancelPolicy(string policyId)
        {
            try
            {
                _policyService.CancelPolicy(policyId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{policyId}/discontinue")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult DiscontinuePolicy(string policyId)
        {
            try
            {
                _policyService.DiscontinuePolicy(policyId);
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

        [HttpPut("{policyId}/package")]
        [Authorize]
        public IActionResult ChangePolicyPackage(string policyId, [FromBody] ChangePolicyPackageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PackageId))
            {
                return BadRequest(new { message = "A package ID is required." });
            }

            try
            {
                var result = _policyService.ChangePolicyPackage(policyId, request.PackageId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "The database could not complete the policy change.",
                        details = ex.InnerException?.Message ?? ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "An unexpected error occurred while changing the policy.",
                        details = ex.Message
                    }
                );
            }
        }

        [HttpDelete("{policyId}")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult DeletePolicy(string policyId)
        {
            try
            {
                _policyService.DeletePolicy(policyId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("{policyId}/beneficiaries")]
        public IActionResult AddBeneficiary(string policyId, [FromBody] Beneficiary beneficiary)
        {
            try
            {
                _policyService.AddBeneficiary(policyId, beneficiary);
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

        [HttpDelete("{policyId}/beneficiaries/{beneficiaryId}")]
        public IActionResult RemoveBeneficiary(string policyId, string beneficiaryId)
        {
            try
            {
                _policyService.RemoveBeneficiary(policyId, beneficiaryId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}