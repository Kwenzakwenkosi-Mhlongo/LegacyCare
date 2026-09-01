// ============================================================
// File: Controllers/PackageController.cs
// ============================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models;
using PolicyManagement.Service.PackageManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PackageController : ControllerBase
    {
        private readonly IPackageService _packageService;

        public PackageController(
            IPackageService packageService)
        {
            _packageService = packageService;
        }

        [HttpGet]
        [Authorize(Roles = "Client,Admin,Staff,Clerk")]
        public IActionResult GetAllPackages()
        {
            return Ok(
                _packageService.GetAllPackages());
        }

        [HttpGet("{packageId}")]
        [Authorize(Roles = "Client,Admin,Staff,Clerk")]
        public IActionResult GetPackageById(
            string packageId)
        {
            try
            {
                return Ok(
                    _packageService.GetPackageById(
                        packageId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult CreatePackage(
            [FromBody] Package package)
        {
            try
            {
                var createdPackage =
                    _packageService.CreatePackage(
                        package);

                return CreatedAtAction(
                    nameof(GetPackageById),
                    new
                    {
                        packageId =
                            createdPackage.PackageId
                    },
                    createdPackage);
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

        [HttpPut("{packageId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult UpdatePackage(
            string packageId,
            [FromBody] Package package)
        {
            try
            {
                return Ok(
                    _packageService.UpdatePackage(
                        packageId,
                        package));
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

        [HttpDelete("{packageId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeletePackage(
            string packageId)
        {
            try
            {
                _packageService.DeletePackage(
                    packageId);

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
    }
}

