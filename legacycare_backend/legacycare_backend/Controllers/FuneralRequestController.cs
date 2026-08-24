using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.MortuaryManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FuneralRequestController
        : ControllerBase
    {
        private readonly IFuneralRequestService _service;

        public FuneralRequestController(
            IFuneralRequestService service)
        {
            _service = service;
        }

        // ============================================================
        // CLIENT - CREATE
        // POST /api/FuneralRequest
        // ============================================================

        [HttpPost]
        [Authorize(Roles = "Client")]
        public IActionResult Create(
            [FromBody]
            CreateFuneralRequestRequest request)
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

                var created =
                    _service.Create(
                        userId,
                        request);

                return Ok(new
                {
                    message =
                        "Funeral request submitted successfully.",

                    funeralRequestId =
                        created.FuneralRequestId,

                    status =
                        created.Status,

                    funeralDate =
                        created.FuneralDate,

                    funeralTime =
                        created.FuneralTime.ToString(),

                    staffRequired =
                        created.StaffRequired
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
                    "[FuneralRequest] CREATE ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to submit funeral request.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // CLIENT - GET OWN REQUESTS
        // GET /api/FuneralRequest/client
        // ============================================================

        [HttpGet("client")]
        [Authorize(Roles = "Client")]
        public IActionResult GetClientRequests()
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

                var requests =
                    _service
                        .GetByClientUserId(userId)
                        .Select(x => new
                        {
                            funeralRequestId =
                                x.FuneralRequestId,

                            deathNotificationId =
                                x.DeathNotificationId,

                            funeralDate =
                                x.FuneralDate,

                            funeralTime =
                                x.FuneralTime.ToString(),

                            venue =
                                x.Venue,

                            funeralType =
                                x.FuneralType,

                            notes =
                                x.Notes,

                            status =
                                x.Status,

                            rejectionReason =
                                x.RejectionReason,

                            staffRequired =
                                x.StaffRequired,

                            createdDate =
                                x.CreatedDate,

                            approvedDate =
                                x.ApprovedDate,

                            staffDeployed =
                                x.StaffDeployments.Count
                        });

                return Ok(requests);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load funeral requests.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // CLERK - PENDING
        // GET /api/FuneralRequest/clerk/pending
        // ============================================================

        [HttpGet("clerk/pending")]
        [Authorize(Roles = "Clerk,Admin")]
        public IActionResult GetPendingRequests()
        {
            try
            {
                var requests =
                    _service
                        .GetPendingRequests()
                        .Select(x => new
                        {
                            funeralRequestId =
                                x.FuneralRequestId,

                            deathNotificationId =
                                x.DeathNotificationId,

                            clientId =
                                x.ClientId,

                            branchId =
                                x.BranchId,

                            funeralDate =
                                x.FuneralDate,

                            funeralTime =
                                x.FuneralTime.ToString(),

                            venue =
                                x.Venue,

                            funeralType =
                                x.FuneralType,

                            notes =
                                x.Notes,

                            status =
                                x.Status,

                            staffRequired =
                                x.StaffRequired,

                            createdDate =
                                x.CreatedDate
                        });

                return Ok(requests);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load pending funeral requests.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // CLERK - APPROVE / REJECT
        // PUT /api/FuneralRequest/clerk/{id}/review
        // ============================================================

        [HttpPut("clerk/{id}/review")]
        [Authorize(Roles = "Clerk,Admin")]
        public IActionResult Review(
            string id,
            [FromBody]
            ReviewFuneralRequestRequest request)
        {
            try
            {
                var clerkUserId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(
                    clerkUserId))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Unable to determine the logged-in user."
                    });
                }

                var updated =
                    _service.Review(
                        clerkUserId,
                        id,
                        request);

                return Ok(new
                {
                    message =
                        updated.Status == "Approved"
                            ? "Funeral request approved successfully."
                            : "Funeral request rejected successfully.",

                    funeralRequestId =
                        updated.FuneralRequestId,

                    status =
                        updated.Status,

                    staffRequired =
                        updated.StaffRequired,

                    approvedByClerkId =
                        updated.ApprovedByClerkId,

                    approvedDate =
                        updated.ApprovedDate,

                    rejectionReason =
                        updated.RejectionReason
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
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to review funeral request.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // GET BY ID
        // ============================================================

        [HttpGet("{id}")]
        [Authorize(
            Roles = "Admin,Staff,Clerk,Client")]
        public IActionResult GetById(string id)
        {
            try
            {
                var funeral =
                    _service.GetById(id);

                if (funeral == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Funeral request not found."
                    });
                }

                var role =
                    GetCurrentRole();

                if (string.Equals(
                    role,
                    "Client",
                    StringComparison.OrdinalIgnoreCase))
                {
                    var userId =
                        GetCurrentUserId();

                    if (
                        funeral.Client == null ||
                        !string.Equals(
                            funeral.Client.UserId,
                            userId,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return Forbid();
                    }
                }

                return Ok(new
                {
                    funeralRequestId =
                        funeral.FuneralRequestId,

                    deathNotificationId =
                        funeral.DeathNotificationId,

                    funeralDate =
                        funeral.FuneralDate,

                    funeralTime =
                        funeral.FuneralTime.ToString(),

                    venue =
                        funeral.Venue,

                    funeralType =
                        funeral.FuneralType,

                    notes =
                        funeral.Notes,

                    status =
                        funeral.Status,

                    rejectionReason =
                        funeral.RejectionReason,

                    branchId =
                        funeral.BranchId,

                    staffRequired =
                        funeral.StaffRequired,

                    approvedByClerkId =
                        funeral.ApprovedByClerkId,

                    approvedDate =
                        funeral.ApprovedDate,

                    createdDate =
                        funeral.CreatedDate,

                    staffDeployed =
                        funeral.StaffDeployments
                            .Select(x => new
                            {
                                staffId =
                                    x.StaffId,

                                fullName =
                                    x.Staff?.User?.FullName,

                                role =
                                    x.Staff?.StaffRole.ToString(),

                                deployedBy =
                                    x.DeployedByUserId,

                                deployedDate =
                                    x.DeployedDate
                            })
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load funeral request.",
                    error = ex.Message
                });
            }
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(
                       ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub")
                   ?? User.FindFirstValue("userId");
        }

        private string? GetCurrentRole()
        {
            return User.FindFirstValue(
                       ClaimTypes.Role)
                   ?? User.FindFirstValue("role");
        }
    }
}