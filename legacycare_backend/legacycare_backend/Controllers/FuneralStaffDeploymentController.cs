using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.MortuaryManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Clerk,Admin")]
    public class FuneralStaffDeploymentController
        : ControllerBase
    {
        private readonly IFuneralStaffDeploymentService _service;

        public FuneralStaffDeploymentController(
            IFuneralStaffDeploymentService service)
        {
            _service = service;
        }

        // ============================================================
        // GET AVAILABLE STAFF
        // ============================================================
        //
        // GET:
        // /api/FuneralStaffDeployment/available/{funeralRequestId}
        // ?requiredStaff=5
        //
        // ============================================================

        [HttpGet("available/{funeralRequestId}")]
        public IActionResult GetAvailableStaff(
            string funeralRequestId,
            [FromQuery] int requiredStaff)
        {
            try
            {
                if (requiredStaff <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "The number of staff required must be greater than zero."
                    });
                }

                var staff =
                    _service.GetAvailableStaff(
                        funeralRequestId,
                        requiredStaff);

                return Ok(staff);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralStaffDeployment] AVAILABLE ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load available staff.",
                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // GET DEPLOYED STAFF
        // ============================================================

        [HttpGet("{funeralRequestId}")]
        public IActionResult GetDeployedStaff(
            string funeralRequestId)
        {
            try
            {
                var staff =
                    _service.GetByFuneralRequest(
                        funeralRequestId);

                return Ok(staff);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralStaffDeployment] GET ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load deployed staff.",
                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // DEPLOY STAFF
        // ============================================================

        [HttpPost("{funeralRequestId}")]
        public IActionResult DeployStaff(
            string funeralRequestId,
            [FromBody] DeployFuneralStaffRequest request)
        {
            try
            {
                var userId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                if (request == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Staff deployment information is required."
                    });
                }

                var deployments =
                    _service.DeployStaff(
                        userId,
                        funeralRequestId,
                        request);

                return Ok(new
                {
                    message =
                        "Staff deployed successfully.",

                    funeralRequestId =
                        funeralRequestId,

                    staffDeployed =
                        deployments.Count()
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralStaffDeployment] DEPLOY ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to deploy staff.",
                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // REMOVE STAFF DEPLOYMENT
        // ============================================================

        [HttpDelete("{deploymentId:int}")]
        public IActionResult RemoveDeployment(
            int deploymentId)
        {
            try
            {
                var userId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                _service.RemoveDeployment(
                    userId,
                    deploymentId);

                return Ok(new
                {
                    message =
                        "Staff deployment removed successfully."
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralStaffDeployment] REMOVE ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to remove staff deployment.",
                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // CURRENT USER
        // ============================================================

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(
                       ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub")
                   ?? User.FindFirstValue("userId");
        }
    }
}