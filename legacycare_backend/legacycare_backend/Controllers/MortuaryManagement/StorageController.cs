using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Service.MortuaryManagement;

namespace PolicyManagement.Controllers.MortuaryManagement
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff,Clerk")]
    public class StorageController : ControllerBase
    {
        private readonly IStorageService _storageService;

        public StorageController(
            IStorageService storageService)
        {
            _storageService = storageService;
        }

        [HttpGet]
        public IActionResult GetAllStorageUnits()
        {
            return Ok(_storageService.GetAllStorageUnits());
        }

        [HttpGet("available")]
        public IActionResult GetAvailableStorageUnits()
        {
            return Ok(_storageService.GetAvailableStorageUnits());
        }

        [HttpGet("{storageId}")]
        public IActionResult GetStorageById(string storageId)
        {
            try
            {
                return Ok(
                    _storageService.GetStorageById(storageId));
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult CreateStorage(
            [FromBody] Storage storage)
        {
            try
            {
                var created =
                    _storageService.CreateStorage(storage);

                return CreatedAtAction(
                    nameof(GetStorageById),
                    new { storageId = created.StorageId },
                    created);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{storageId}")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult UpdateStorage(
            string storageId,
            [FromBody] Storage storage)
        {
            try
            {
                return Ok(
                    _storageService.UpdateStorage(
                        storageId,
                        storage));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{storageId}/available")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult MarkAvailable(string storageId)
        {
            _storageService.MarkAvailable(storageId);

            return NoContent();
        }

        [HttpPut("{storageId}/unavailable")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult MarkUnavailable(string storageId)
        {
            _storageService.MarkUnavailable(storageId);

            return NoContent();
        }

        [HttpDelete("{storageId}")]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult DeleteStorage(string storageId)
        {
            _storageService.DeleteStorage(storageId);

            return NoContent();
        }
    }
}