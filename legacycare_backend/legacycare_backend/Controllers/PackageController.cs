using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models;
using PolicyManagement.Service.PackageManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PackageController : ControllerBase
    {
        private readonly IPackageService _packageService;

        public PackageController(IPackageService packageService)
        {
            _packageService = packageService;
        }

        // GET: api/Package
        [HttpGet]
        public IActionResult GetAllPackages()
        {
            return Ok(_packageService.GetAllPackages());
        }

        // GET: api/Package/{packageId}
        [HttpGet("{packageId}")]
        public IActionResult GetPackageById(string packageId)
        {
            try
            {
                return Ok(_packageService.GetPackageById(packageId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // POST: api/Package
        [HttpPost]
        public IActionResult CreatePackage([FromBody] Package package)
        {
            try
            {
                var createdPackage = _packageService.CreatePackage(package);

                return CreatedAtAction(
                    nameof(GetPackageById),
                    new { packageId = createdPackage.PackageId },
                    createdPackage);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/Package/{packageId}
        [HttpPut("{packageId}")]
        public IActionResult UpdatePackage(string packageId, [FromBody] Package package)
        {
            try
            {
                return Ok(_packageService.UpdatePackage(packageId, package));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/Package/{packageId}
        [HttpDelete("{packageId}")]
        public IActionResult DeletePackage(string packageId)
        {
            try
            {
                _packageService.DeletePackage(packageId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
