using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Service.MortuaryManagement;
using PolicyManagement.DTOs.Requests;

namespace PolicyManagement.Controllers.MortuaryManagement
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff,Clerk")]
    public class DeceasedController : ControllerBase
    {
        private readonly IDeceasedService _deceasedService;
        private readonly IDeceasedStorageService _deceasedStorageService;

        public DeceasedController(
            IDeceasedService deceasedService,
            IDeceasedStorageService deceasedStorageService)
        {
            _deceasedService = deceasedService;
            _deceasedStorageService = deceasedStorageService;
        }

        [HttpGet]
        public IActionResult GetAllDeceased()
        {
            return Ok(_deceasedService.GetAllDeceased());
        }

        [HttpGet("{deceasedId}")]
        public IActionResult GetDeceasedById(string deceasedId)
        {
            try
            {
                return Ok(_deceasedService.GetDeceasedById(deceasedId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("search/{keyword}")]
        public IActionResult SearchDeceased(string keyword)
        {
            return Ok(_deceasedService.SearchDeceased(keyword));
        }

        [HttpGet("lookup")]
        [Authorize(Roles = "Admin,Staff,Clerk")]
        public IActionResult GetDeceasedLookup()
        {
            try
            {
                var deceased = _deceasedService.GetAllDeceased();

                var lookupData = deceased
                    .Select(d => new
                    {
                        deceasedId = d.DeceasedId,
                        fullName = d.FullName,
                        idNumber = d.IDNumber
                    })
                    .OrderBy(d => d.fullName)
                    .ToList();

                return Ok(lookupData);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult RegisterDeceased([FromBody] Deceased deceased)
        {
            try
            {
                var created = _deceasedService.RegisterDeceased(deceased);

                return CreatedAtAction(
                    nameof(GetDeceasedById),
                    new { deceasedId = created.DeceasedId },
                    created);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{deceasedId}")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult UpdateDeceased(
            string deceasedId,
            [FromBody] UpdateDeceasedRequest request)
        {
            try
            {
                var deceased = _deceasedService.GetDeceasedById(deceasedId);

                if (!string.IsNullOrWhiteSpace(request.FullName))
                    deceased.FullName = request.FullName;

                if (!string.IsNullOrWhiteSpace(request.Gender))
                    deceased.Gender = request.Gender;

                deceased.CauseOfDeath = request.CauseOfDeath;

                var updated = _deceasedService.UpdateDeceased(deceasedId, deceased);

                return Ok(updated);
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

        [HttpPut("{deceasedId}/release")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult ReleaseDeceased(string deceasedId)
        {
            try
            {
                // 1. Release the storage assignment first
                var assignments = _deceasedStorageService.GetAssignmentsByDeceased(deceasedId);
                var activeAssignment = assignments.FirstOrDefault(a => a.DateRemoved == null);

                if (activeAssignment != null)
                {
                    _deceasedStorageService.ReleaseStorage(activeAssignment.AssignmentId);
                }

                // 2. Release the deceased
                _deceasedService.ReleaseDeceased(deceasedId);

                return NoContent();
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

        [HttpDelete("{deceasedId}")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult DeleteDeceased(string deceasedId)
        {
            try
            {
                _deceasedService.DeleteDeceased(deceasedId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}