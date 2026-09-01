// ============================================================================
// File: Controllers/BeneficiaryController.cs
// ============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BeneficiaryController : BaseController
    {
        private readonly IBeneficiaryService
            _beneficiaryService;

        private readonly AppDbContext
            _context;

        public BeneficiaryController(
            IBeneficiaryService beneficiaryService,
            AppDbContext context)
        {
            _beneficiaryService =
                beneficiaryService;

            _context =
                context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetAllBeneficiaries()
        {
            return Ok(
                _beneficiaryService
                    .GetAllBeneficiaries());
        }

        // ====================================================================
        // CLIENT CURRENT BENEFICIARIES
        // Alive only.
        //
        // GET /api/Beneficiary/client/policy/{policyId}
        // ====================================================================

        [HttpGet("client/policy/{policyId}")]
        [Authorize(Roles = "Client")]
        public IActionResult GetClientBeneficiaries(
            string policyId)
        {
            try
            {
                EnsureClientOwnsPolicy(
                    policyId);

                return Ok(
                    _beneficiaryService
                        .GetBeneficiariesByPolicy(
                            policyId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        // ====================================================================
        // CLIENT PAST BENEFICIARIES
        // Removed + Deceased only.
        //
        // GET /api/Beneficiary/client/policy/{policyId}/past
        // ====================================================================

        [HttpGet("client/policy/{policyId}/past")]
        [Authorize(Roles = "Client")]
        public IActionResult GetClientPastBeneficiaries(
            string policyId)
        {
            try
            {
                EnsureClientOwnsPolicy(
                    policyId);

                return Ok(
                    _beneficiaryService
                        .GetPastBeneficiariesByPolicy(
                            policyId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpGet("{beneficiaryId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetBeneficiaryById(
            string beneficiaryId)
        {
            try
            {
                return Ok(
                    _beneficiaryService
                        .GetBeneficiaryById(
                            beneficiaryId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpGet("policy/{policyId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetBeneficiariesByPolicy(
            string policyId)
        {
            try
            {
                return Ok(
                    _beneficiaryService
                        .GetBeneficiariesByPolicy(
                            policyId));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpGet("policy/{policyId}/past")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetPastBeneficiariesByPolicy(
            string policyId)
        {
            try
            {
                return Ok(
                    _beneficiaryService
                        .GetPastBeneficiariesByPolicy(
                            policyId));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult CreateBeneficiary(
            [FromBody] Beneficiary beneficiary)
        {
            try
            {
                return Ok(
                    _beneficiaryService
                        .CreateBeneficiary(
                            beneficiary));
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpPut("{beneficiaryId}")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult UpdateBeneficiary(
            string beneficiaryId,
            [FromBody] Beneficiary beneficiary)
        {
            try
            {
                return Ok(
                    _beneficiaryService
                        .UpdateBeneficiary(
                            beneficiaryId,
                            beneficiary));
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpPut("{beneficiaryId}/remove")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult RemoveBeneficiary(
            string beneficiaryId)
        {
            try
            {
                _beneficiaryService
                    .RemoveBeneficiary(
                        beneficiaryId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpPut("{beneficiaryId}/reinstate")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult ReinstateBeneficiary(
            string beneficiaryId)
        {
            try
            {
                _beneficiaryService
                    .ReinstateBeneficiary(
                        beneficiaryId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpPut("{beneficiaryId}/deceased")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult MarkAsDeceased(
            string beneficiaryId)
        {
            try
            {
                _beneficiaryService
                    .MarkAsDeceased(
                        beneficiaryId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        [HttpDelete("{beneficiaryId}")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult DeleteBeneficiary(
            string beneficiaryId)
        {
            try
            {
                _beneficiaryService
                    .DeleteBeneficiary(
                        beneficiaryId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        private void EnsureClientOwnsPolicy(
            string policyId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            var ownsPolicy =
                _context.Policy
                    .AsNoTracking()
                    .Any(policy =>
                        policy.PolicyId == policyId &&
                        policy.UserId == UserId);

            if (!ownsPolicy)
            {
                throw new KeyNotFoundException(
                    "Policy not found or does not belong to this client.");
            }
        }
    }
}
