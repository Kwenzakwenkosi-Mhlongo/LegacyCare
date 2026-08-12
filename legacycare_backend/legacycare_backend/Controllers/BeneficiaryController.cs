using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BeneficiaryController : ControllerBase
    {
        private readonly IBeneficiaryService _beneficiaryService;

        public BeneficiaryController(IBeneficiaryService beneficiaryService)
        {
            _beneficiaryService = beneficiaryService;
        }

        // GET: api/Beneficiary
        [HttpGet]
        public IActionResult GetAllBeneficiaries()
        {
            return Ok(_beneficiaryService.GetAllBeneficiaries());
        }

        // GET: api/Beneficiary/{beneficiaryId}
        [HttpGet("{beneficiaryId}")]
        public IActionResult GetBeneficiaryById(string beneficiaryId)
        {
            try
            {
                return Ok(_beneficiaryService.GetBeneficiaryById(beneficiaryId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // GET: api/Beneficiary/policy/{policyId}
        [HttpGet("policy/{policyId}")]
        public IActionResult GetBeneficiariesByPolicy(string policyId)
        {
            return Ok(_beneficiaryService.GetBeneficiariesByPolicy(policyId));
        }

        // POST: api/Beneficiary
        [HttpPost]
        public IActionResult CreateBeneficiary([FromBody] Beneficiary beneficiary)
        {
            try
            {
                var created = _beneficiaryService.CreateBeneficiary(beneficiary);
                return CreatedAtAction(
                    nameof(GetBeneficiaryById),
                    new { beneficiaryId = created.BeneficiaryId },
                    created);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/Beneficiary/{beneficiaryId}
        [HttpPut("{beneficiaryId}")]
        public IActionResult UpdateBeneficiary(string beneficiaryId, [FromBody] Beneficiary beneficiary)
        {
            try
            {
                return Ok(_beneficiaryService.UpdateBeneficiary(beneficiaryId, beneficiary));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/Beneficiary/{beneficiaryId}/deceased
        [HttpPut("{beneficiaryId}/deceased")]
        public IActionResult MarkAsDeceased(string beneficiaryId)
        {
            try
            {
                _beneficiaryService.MarkAsDeceased(beneficiaryId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/Beneficiary/{beneficiaryId}/remove
        [HttpPut("{beneficiaryId}/remove")]
        public IActionResult RemoveBeneficiary(string beneficiaryId)
        {
            try
            {
                _beneficiaryService.RemoveBeneficiary(beneficiaryId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/Beneficiary/{beneficiaryId}/reinstate
        [HttpPut("{beneficiaryId}/reinstate")]
        public IActionResult ReinstateBeneficiary(string beneficiaryId)
        {
            try
            {
                _beneficiaryService.ReinstateBeneficiary(beneficiaryId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/Beneficiary/{beneficiaryId}
        [HttpDelete("{beneficiaryId}")]
        public IActionResult DeleteBeneficiary(string beneficiaryId)
        {
            try
            {
                _beneficiaryService.DeleteBeneficiary(beneficiaryId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}