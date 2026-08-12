using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Service.MortuaryManagement;

namespace PolicyManagement.Controllers.MortuaryManagement
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff,Clerk")]
    public class DeceasedStorageController : ControllerBase
    {
        private readonly IDeceasedStorageService _service;

        public DeceasedStorageController(IDeceasedStorageService service)
        {
            _service = service;
        }

        [HttpGet]
        public IActionResult GetAllAssignments()
        {
            return Ok(_service.GetAllAssignments());
        }

        [HttpGet("{assignmentId}")]
        public IActionResult GetAssignmentById(string assignmentId)
        {
            try
            {
                return Ok(_service.GetAssignmentById(assignmentId));
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("deceased/{deceasedId}")]
        public IActionResult GetAssignmentsByDeceased(string deceasedId)
        {
            return Ok(_service.GetAssignmentsByDeceased(deceasedId));
        }

        [HttpGet("storage/{storageId}")]
        public IActionResult GetAssignmentsByStorage(string storageId)
        {
            return Ok(_service.GetAssignmentsByStorage(storageId));
        }

        [HttpPost]
        public IActionResult AssignStorage([FromBody] AssignStorageRequest request)
        {
            try
            {
                var assignment = new DeceasedStorage
                {
                    AssignmentId = string.IsNullOrEmpty(request.AssignmentId) ? Guid.NewGuid().ToString() : request.AssignmentId,
                    StorageId = request.StorageId,
                    DeceasedId = request.DeceasedId,
                    DateAssigned = request.DateAssigned == DateTime.MinValue ? DateTime.UtcNow : request.DateAssigned,
                    DateRemoved = null
                };

                var created = _service.AssignStorage(assignment);

                return CreatedAtAction(
                    nameof(GetAssignmentById),
                    new { assignmentId = created.AssignmentId },
                    created);
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

        [HttpPut("{assignmentId}/release")]
        public IActionResult ReleaseStorage(string assignmentId)
        {
            try
            {
                _service.ReleaseStorage(assignmentId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}