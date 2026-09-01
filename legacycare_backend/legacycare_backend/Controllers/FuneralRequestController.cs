// Controllers/FuneralRequestController.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Service.MortuaryManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FuneralRequestController : ControllerBase
    {
        private const int StaffPerFuneral = 4;

        private readonly IFuneralRequestService _funeralService;
        private readonly IFuneralStaffDeploymentService _staffDeploymentService;
        private readonly AppDbContext _context;

        public FuneralRequestController(
            IFuneralRequestService funeralService,
            IFuneralStaffDeploymentService staffDeploymentService,
            AppDbContext context)
        {
            _funeralService = funeralService;
            _staffDeploymentService = staffDeploymentService;
            _context = context;
        }

        // ============================================================
        // CLIENT - CREATE FUNERAL REQUEST
        // POST /api/FuneralRequest
        // ============================================================

        [HttpPost]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> Create(
            [FromBody] CreateFuneralRequestRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new
                    {
                        message = "Funeral request information is required."
                    });
                }

                var userId = GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new
                    {
                        message = "Unable to determine the logged-in user."
                    });
                }

                var created = _funeralService.Create(
                    userId,
                    request);

                if (created == null)
                {
                    return StatusCode(500, new
                    {
                        message = "The funeral request could not be created."
                    });
                }

                if (string.IsNullOrWhiteSpace(created.FuneralRequestId))
                {
                    return StatusCode(500, new
                    {
                        message = "The funeral request was created without a valid ID."
                    });
                }

                created.StaffRequired = StaffPerFuneral;

                var serviceRequest =
                    await _context.ServiceRequests
                        .FirstOrDefaultAsync(
                            x =>
                                x.FuneralRequestId ==
                                created.FuneralRequestId,
                            cancellationToken);

                if (serviceRequest == null)
                {
                    var funeralDateTime =
                        created.FuneralDate.Date
                            .Add(created.FuneralTime);

                    serviceRequest =
                        new ServiceRequest
                        {
                            ClientId =
                                created.ClientId,

                            BranchId =
                                created.BranchId,

                            RequestType =
                                "Funeral",

                            Status =
                                string.IsNullOrWhiteSpace(created.Status)
                                    ? "Pending"
                                    : created.Status,

                            Priority =
                                "Normal",

                            Description =
                                BuildFuneralDescription(created),

                            FuneralRequestId =
                                created.FuneralRequestId,

                            DeathNotificationId =
                                created.DeathNotificationId,

                            AppointmentDateTime =
                                funeralDateTime,

                            DueDate =
                                funeralDateTime,

                            AssignedStaffId =
                                null,

                            CreatedDate =
                                DateTime.UtcNow,

                            UpdatedDate =
                                DateTime.UtcNow,

                            AdditionalFee =
                                0
                        };

                    _context.ServiceRequests.Add(
                        serviceRequest);
                }

                await _context.SaveChangesAsync(
                    cancellationToken);

                var staffAssigned =
                    created.StaffDeployments?.Count
                    ?? 0;

                return Ok(new
                {
                    message =
                        "Funeral request submitted successfully.",

                    funeralRequestId =
                        created.FuneralRequestId,

                    serviceRequestId =
                        serviceRequest.ServiceRequestId,

                    deathNotificationId =
                        created.DeathNotificationId,

                    clientId =
                        created.ClientId,

                    branchId =
                        created.BranchId,

                    branchName =
                        created.Branch?.BranchName,

                    funeralType =
                        created.FuneralType,

                    funeralDate =
                        created.FuneralDate,

                    funeralTime =
                        created.FuneralTime.ToString(),

                    venue =
                        created.Venue,

                    notes =
                        created.Notes,

                    status =
                        created.Status,

                    staffRequired =
                        StaffPerFuneral,

                    staffAssigned,

                    staffRemaining =
                        Math.Max(
                            0,
                            StaffPerFuneral -
                            staffAssigned),

                    staffingStatus =
                        GetStaffingStatus(
                            staffAssigned),

                    createdDate =
                        created.CreatedDate
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
            catch (DbUpdateException ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] DATABASE CREATE ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to save the funeral request.",

                    error =
                        ex.InnerException?.Message ??
                        ex.Message
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

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // CLIENT - GET OWN FUNERAL REQUESTS
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
                    _funeralService
                        .GetByClientUserId(userId)
                        .Select(x =>
                        {
                            var staffAssigned =
                                x.StaffDeployments?.Count
                                ?? 0;

                            return new
                            {
                                funeralRequestId =
                                    x.FuneralRequestId,

                                deathNotificationId =
                                    x.DeathNotificationId,

                                clientId =
                                    x.ClientId,

                                branchId =
                                    x.BranchId,

                                branchName =
                                    x.Branch?.BranchName,

                                funeralType =
                                    x.FuneralType,

                                funeralDate =
                                    x.FuneralDate,

                                funeralTime =
                                    x.FuneralTime.ToString(),

                                venue =
                                    x.Venue,

                                notes =
                                    x.Notes,

                                status =
                                    x.Status,

                                rejectionReason =
                                    x.RejectionReason,

                                staffRequired =
                                    StaffPerFuneral,

                                staffAssigned,

                                staffRemaining =
                                    Math.Max(
                                        0,
                                        StaffPerFuneral -
                                        staffAssigned),

                                staffingStatus =
                                    GetStaffingStatus(
                                        staffAssigned),

                                createdDate =
                                    x.CreatedDate,

                                updatedDate =
                                    x.UpdatedDate,

                                approvedDate =
                                    x.ApprovedDate,

                                approvedByClerkId =
                                    x.ApprovedByClerkId
                            };
                        })
                        .ToList();

                return Ok(
                    requests);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] CLIENT REQUESTS ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load funeral requests.",

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // CLERK / ADMIN - PENDING REQUESTS
        // GET /api/FuneralRequest/clerk/pending
        // ============================================================

        [HttpGet("clerk/pending")]
        [Authorize(Roles = "Clerk,Admin")]
        public IActionResult GetPendingRequests()
        {
            try
            {
                var requests =
                    _funeralService
                        .GetPendingRequests()
                        .Select(x =>
                        {
                            var staffAssigned =
                                x.StaffDeployments?.Count
                                ?? 0;

                            return new
                            {
                                funeralRequestId =
                                    x.FuneralRequestId,

                                deathNotificationId =
                                    x.DeathNotificationId,

                                clientId =
                                    x.ClientId,

                                branchId =
                                    x.BranchId,

                                branchName =
                                    x.Branch?.BranchName,

                                funeralType =
                                    x.FuneralType,

                                funeralDate =
                                    x.FuneralDate,

                                funeralTime =
                                    x.FuneralTime.ToString(),

                                venue =
                                    x.Venue,

                                notes =
                                    x.Notes,

                                status =
                                    x.Status,

                                staffRequired =
                                    StaffPerFuneral,

                                staffAssigned,

                                staffRemaining =
                                    Math.Max(
                                        0,
                                        StaffPerFuneral -
                                        staffAssigned),

                                staffingStatus =
                                    GetStaffingStatus(
                                        staffAssigned),

                                createdDate =
                                    x.CreatedDate
                            };
                        })
                        .ToList();

                return Ok(
                    requests);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] PENDING REQUESTS ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load pending funeral requests.",

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // CLERK / ADMIN - AVAILABLE STAFF
        // GET /api/FuneralRequest/clerk/{id}/available-staff
        // ============================================================

        [HttpGet("clerk/{id}/available-staff")]
        [Authorize(Roles = "Clerk,Admin")]
        public IActionResult GetAvailableStaff(
            string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(new
                    {
                        message =
                            "Funeral request ID is required."
                    });
                }

                var staff =
                    _staffDeploymentService
                        .GetAvailableStaff(
                            id,
                            StaffPerFuneral)
                        .ToList();

                return Ok(new
                {
                    staffRequired =
                        StaffPerFuneral,

                    availableCount =
                        staff.Count,

                    staff
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message =
                        ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] AVAILABLE STAFF ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load available funeral staff.",

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // CLERK / ADMIN - ASSIGN EXACTLY 4 STAFF
        // PUT /api/FuneralRequest/clerk/{id}/staff
        // ============================================================

        [HttpPut("clerk/{id}/staff")]
        [Authorize(Roles = "Clerk,Admin")]
        public IActionResult AssignStaff(
            string id,
            [FromBody] DeployFuneralStaffRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(new
                    {
                        message =
                            "Funeral request ID is required."
                    });
                }

                if (request == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Staff selection is required."
                    });
                }

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

                var deployments =
                    _staffDeploymentService
                        .DeployStaff(
                            clerkUserId,
                            id,
                            request)
                        .ToList();

                var assignedStaff =
                    deployments
                        .Select(x => new
                        {
                            staffId =
                                x.StaffId,

                            displayStaffId =
                                x.Staff?.DisplayStaffId,

                            fullName =
                                x.Staff?.User?.FullName,

                            role =
                                x.Staff?.StaffRole.ToString(),

                            branchId =
                                x.Staff?.BranchId,

                            deployedBy =
                                x.DeployedByUserId,

                            deployedDate =
                                x.DeployedDate
                        })
                        .ToList();

                return Ok(new
                {
                    message =
                        "Funeral staff assigned successfully.",

                    funeralRequestId =
                        id,

                    staffRequired =
                        StaffPerFuneral,

                    staffAssigned =
                        assignedStaff.Count,

                    staffRemaining =
                        Math.Max(
                            0,
                            StaffPerFuneral -
                            assignedStaff.Count),

                    staffingStatus =
                        GetStaffingStatus(
                            assignedStaff.Count),

                    staff =
                        assignedStaff
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message =
                        ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] ASSIGN STAFF ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to assign funeral staff.",

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // CLERK / ADMIN - REMOVE STAFF ASSIGNMENT
        // DELETE /api/FuneralRequest/clerk/staff/{deploymentId}
        // ============================================================

        [HttpDelete("clerk/staff/{deploymentId:int}")]
        [Authorize(Roles = "Clerk,Admin")]
        public IActionResult RemoveStaffDeployment(
            int deploymentId)
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

                _staffDeploymentService
                    .RemoveDeployment(
                        clerkUserId,
                        deploymentId);

                return Ok(new
                {
                    message =
                        "Funeral staff assignment removed successfully."
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message =
                        ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] REMOVE STAFF ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to remove the funeral staff assignment.",

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // CLERK / ADMIN - APPROVE / REJECT
        // PUT /api/FuneralRequest/clerk/{id}/review
        // ============================================================

        [HttpPut("clerk/{id}/review")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> Review(
            string id,
            [FromBody] ReviewFuneralRequestRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(new
                    {
                        message =
                            "Funeral request ID is required."
                    });
                }

                if (request == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Review information is required."
                    });
                }

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
                    _funeralService.Review(
                        clerkUserId,
                        id,
                        request);

                var serviceRequest =
                    await _context.ServiceRequests
                        .FirstOrDefaultAsync(
                            x =>
                                x.FuneralRequestId ==
                                updated.FuneralRequestId,
                            cancellationToken);

                if (serviceRequest != null)
                {
                    serviceRequest.Status =
                        updated.Status;

                    serviceRequest.BranchId =
                        updated.BranchId;

                    serviceRequest.AppointmentDateTime =
                        updated.FuneralDate.Date
                            .Add(
                                updated.FuneralTime);

                    serviceRequest.DueDate =
                        serviceRequest.AppointmentDateTime;

                    serviceRequest.UpdatedDate =
                        DateTime.UtcNow;

                    await _context.SaveChangesAsync(
                        cancellationToken);
                }

                var staffAssigned =
                    updated.StaffDeployments?.Count
                    ?? 0;

                return Ok(new
                {
                    message =
                        string.Equals(
                            updated.Status,
                            "Approved",
                            StringComparison.OrdinalIgnoreCase)
                            ? "Funeral request approved successfully."
                            : string.Equals(
                                updated.Status,
                                "Rejected",
                                StringComparison.OrdinalIgnoreCase)
                                ? "Funeral request rejected successfully."
                                : "Funeral request updated successfully.",

                    funeralRequestId =
                        updated.FuneralRequestId,

                    serviceRequestId =
                        serviceRequest?.ServiceRequestId,

                    status =
                        updated.Status,

                    branchId =
                        updated.BranchId,

                    branchName =
                        updated.Branch?.BranchName,

                    staffRequired =
                        StaffPerFuneral,

                    staffAssigned,

                    staffRemaining =
                        Math.Max(
                            0,
                            StaffPerFuneral -
                            staffAssigned),

                    staffingStatus =
                        GetStaffingStatus(
                            staffAssigned),

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
                    message =
                        ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message =
                        ex.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] REVIEW ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to review funeral request.",

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // GET BY ID
        // GET /api/FuneralRequest/{id}
        // ============================================================

        [HttpGet("{id}")]
        [Authorize(
            Roles = "Admin,Staff,Clerk,Client")]
        public IActionResult GetById(
            string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    return BadRequest(new
                    {
                        message =
                            "Funeral request ID is required."
                    });
                }

                var funeral =
                    _funeralService.GetById(
                        id);

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

                var staffAssigned =
                    funeral.StaffDeployments?.Count
                    ?? 0;

                var assignedStaff =
                    (funeral.StaffDeployments
                        ?? Array.Empty<FuneralStaffDeployment>())
                    .Select(x => new
                    {
                        funeralStaffDeploymentId =
                            x.FuneralStaffDeploymentId,

                        staffId =
                            x.StaffId,

                        displayStaffId =
                            x.Staff?.DisplayStaffId,

                        fullName =
                            x.Staff?.User?.FullName,

                        role =
                            x.Staff?.StaffRole.ToString(),

                        branchId =
                            x.Staff?.BranchId,

                        deployedBy =
                            x.DeployedByUserId,

                        deployedDate =
                            x.DeployedDate
                    })
                    .ToList();

                return Ok(new
                {
                    funeralRequestId =
                        funeral.FuneralRequestId,

                    deathNotificationId =
                        funeral.DeathNotificationId,

                    clientId =
                        funeral.ClientId,

                    branchId =
                        funeral.BranchId,

                    branchName =
                        funeral.Branch?.BranchName,

                    funeralType =
                        funeral.FuneralType,

                    funeralDate =
                        funeral.FuneralDate,

                    funeralTime =
                        funeral.FuneralTime.ToString(),

                    venue =
                        funeral.Venue,

                    notes =
                        funeral.Notes,

                    status =
                        funeral.Status,

                    rejectionReason =
                        funeral.RejectionReason,

                    staffRequired =
                        StaffPerFuneral,

                    staffAssigned,

                    staffRemaining =
                        Math.Max(
                            0,
                            StaffPerFuneral -
                            staffAssigned),

                    staffingStatus =
                        GetStaffingStatus(
                            staffAssigned),

                    approvedByClerkId =
                        funeral.ApprovedByClerkId,

                    approvedDate =
                        funeral.ApprovedDate,

                    createdDate =
                        funeral.CreatedDate,

                    updatedDate =
                        funeral.UpdatedDate,

                    staffDeployed =
                        assignedStaff
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[FuneralRequest] GET BY ID ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load funeral request.",

                    error =
                        ex.Message
                });
            }
        }

        // ============================================================
        // HELPERS
        // ============================================================

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(
                       ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue(
                       "sub")
                   ?? User.FindFirstValue(
                       "userId");
        }

        private string? GetCurrentRole()
        {
            return User.FindFirstValue(
                       ClaimTypes.Role)
                   ?? User.FindFirstValue(
                       "role");
        }

        private static string GetStaffingStatus(
            int staffAssigned)
        {
            if (staffAssigned >=
                StaffPerFuneral)
            {
                return "Fully Staffed";
            }

            if (staffAssigned > 0)
            {
                return "Partially Staffed";
            }

            return "Awaiting Clerk Assignment";
        }

        private static string BuildFuneralDescription(
            FuneralRequest funeral)
        {
            var funeralType =
                string.IsNullOrWhiteSpace(
                    funeral.FuneralType)
                    ? "Standard"
                    : funeral.FuneralType.Trim();

            var venue =
                string.IsNullOrWhiteSpace(
                    funeral.Venue)
                    ? "Venue not specified"
                    : funeral.Venue.Trim();

            return
                $"{funeralType} funeral on " +
                $"{funeral.FuneralDate:dd MMMM yyyy} at " +
                $"{funeral.FuneralTime:hh\\:mm}. " +
                $"Venue: {venue}. " +
                $"LegacyCare staff required: {StaffPerFuneral}.";
        }
    }
}