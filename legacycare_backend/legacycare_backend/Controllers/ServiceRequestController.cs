// Controllers/ServiceRequestController.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.ServiceRequestManagement;
using PolicyManagement.Service.UserManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ServiceRequestController : ControllerBase
    {
        private readonly IServiceRequestService _serviceRequestService;
        private readonly IClientService _clientService;
        private readonly AppDbContext _context;

        public ServiceRequestController(
            IServiceRequestService serviceRequestService,
            IClientService clientService,
            AppDbContext context)
        {
            _serviceRequestService = serviceRequestService;
            _clientService = clientService;
            _context = context;
        }

        // ============================================================
        // GET ALL
        // GET: /api/ServiceRequest
        // ============================================================

        [HttpGet]
        [Authorize(Roles = "Admin,Clerk")]
        public IActionResult GetAll()
        {
            try
            {
                return Ok(
                    _serviceRequestService.GetAll()
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] GetAll error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // GET MY REQUESTS
        // GET: /api/ServiceRequest/my
        // ============================================================

        [HttpGet("my")]
        [Authorize(Roles = "Client")]
        public IActionResult GetMyRequests()
        {
            return GetClientRequests();
        }

        // ============================================================
        // GET CLIENT REQUESTS
        // GET: /api/ServiceRequest/client
        // ============================================================

        [HttpGet("client")]
        [Authorize(Roles = "Client")]
        public IActionResult GetClientRequests()
        {
            try
            {
                var clientResult =
                    ResolveCurrentClient();

                if (clientResult.Error != null)
                {
                    return clientResult.Error;
                }

                var clientId =
                    clientResult.ClientId!;

                var requests =
                    _serviceRequestService
                        .GetByClient(clientId);

                Console.WriteLine(
                    $"[ServiceRequestController] Requests found: {requests.Count()}"
                );

                return Ok(requests);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] GetClientRequests error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // GET BY ID
        // GET: /api/ServiceRequest/{id}
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(
            int id,
            CancellationToken cancellationToken)
        {
            try
            {
                var request =
                    _serviceRequestService
                        .GetById(id);

                if (request == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Service request was not found."
                        }
                    );
                }

                var role =
                    User.FindFirstValue(
                        ClaimTypes.Role
                    )
                    ?? User.FindFirstValue("role")
                    ?? string.Empty;

                if (string.Equals(
                    role,
                    "Client",
                    StringComparison.OrdinalIgnoreCase))
                {
                    var clientResult =
                        ResolveCurrentClient();

                    if (clientResult.Error != null)
                    {
                        return clientResult.Error;
                    }

                    if (!string.Equals(
                        request.ClientId,
                        clientResult.ClientId,
                        StringComparison.OrdinalIgnoreCase))
                    {
                        return Forbid();
                    }
                }

                // ----------------------------------------------------
                // NORMAL SERVICE REQUEST
                // ----------------------------------------------------

                var isDeathRequest =
                    !string.IsNullOrWhiteSpace(
                        request.RequestType
                    )
                    &&
                    request.RequestType.Contains(
                        "death",
                        StringComparison.OrdinalIgnoreCase
                    );

                if (!isDeathRequest)
                {
                    return Ok(request);
                }

                // ----------------------------------------------------
                // DEATH NOTIFICATION LINK
                //
                // Requires ServiceRequest.DeathNotificationId.
                // ----------------------------------------------------

                var deathNotificationId =
                    request.DeathNotificationId;

                if (string.IsNullOrWhiteSpace(
                    deathNotificationId))
                {
                    return Ok(
                        new
                        {
                            request.ServiceRequestId,
                            request.ClientId,
                            request.RequestType,
                            request.Status,
                            request.Priority,
                            request.Description,
                            request.BranchId,
                            request.AssignedStaffId,
                            request.CreatedDate,
                            request.UpdatedDate,
                            request.DueDate,
                            request.AppointmentDateTime,
                            request.AdditionalFee,

                            deathNotificationId =
                                (string?)null,

                            deathNotification =
                                (object?)null
                        }
                    );
                }

                var notification =
                    await _context
                        .DeathNotifications
                        .AsNoTracking()
                        .Include(x =>
                            x.Beneficiary)
                        .Include(x =>
                            x.Policy)
                        .Include(x =>
                            x.Branch)
                        .Include(x =>
                            x.VerifiedBy)
                        .FirstOrDefaultAsync(
                            x =>
                                x.DeathNotificationId ==
                                deathNotificationId,
                            cancellationToken
                        );

                if (notification == null)
                {
                    return Ok(
                        new
                        {
                            request.ServiceRequestId,
                            request.ClientId,
                            request.RequestType,
                            request.Status,
                            request.Priority,
                            request.Description,
                            request.BranchId,
                            request.AssignedStaffId,
                            request.CreatedDate,
                            request.UpdatedDate,
                            request.DueDate,
                            request.AppointmentDateTime,
                            request.AdditionalFee,

                            deathNotificationId,

                            deathNotification =
                                (object?)null
                        }
                    );
                }

                // ----------------------------------------------------
                // EXTRA CLIENT OWNERSHIP CHECK
                // ----------------------------------------------------

                if (string.Equals(
                    role,
                    "Client",
                    StringComparison.OrdinalIgnoreCase))
                {
                    var userId =
                        GetCurrentUserId();

                    if (!string.Equals(
                        notification.ReportedByUserId,
                        userId,
                        StringComparison.OrdinalIgnoreCase))
                    {
                        return Forbid();
                    }
                }

                return Ok(
                    new
                    {
                        // ============================================
                        // SERVICE REQUEST
                        // ============================================

                        request.ServiceRequestId,
                        request.ClientId,
                        request.RequestType,
                        request.Status,
                        request.Priority,
                        request.Description,
                        request.BranchId,
                        request.AssignedStaffId,
                        request.CreatedDate,
                        request.UpdatedDate,
                        request.DueDate,
                        request.AppointmentDateTime,
                        request.AdditionalFee,

                        deathNotificationId,

                        // ============================================
                        // DEATH NOTIFICATION
                        // ============================================

                        deathNotification =
                            new
                            {
                                notification.DeathNotificationId,

                                notification.RequestNumber,

                                notification.PolicyId,

                                notification.BeneficiaryId,

                                notification.DateOfDeath,

                                notification.DateReported,

                                notification.DateVerified,

                                notification.RelationshipToDeceased,

                                notification.ContactPerson,

                                notification.ContactNumber,

                                notification.BodyLocationType,

                                notification.BodyLocationAddress,

                                notification.MortuaryName,

                                notification.StorageId,

                                notification.StorageUnitNumber,

                                notification.CollectionDate,

                                notification.CollectionNotes,

                                notification.DocumentFileName,

                                status =
                                    notification.Status
                                        .ToString(),

                                notification.RejectionReason,

                                notification.BranchId,

                                beneficiary =
                                    notification.Beneficiary == null
                                        ? null
                                        : new
                                        {
                                            notification
                                                .Beneficiary
                                                .BeneficiaryId,

                                            notification
                                                .Beneficiary
                                                .FullName,

                                            idNumber =
                                                notification
                                                    .Beneficiary
                                                    .IDNumber,

                                            notification
                                                .Beneficiary
                                                .DateOfBirth,

                                            notification
                                                .Beneficiary
                                                .Gender,

                                            notification
                                                .Beneficiary
                                                .Relationship,

                                            status =
                                                notification
                                                    .Beneficiary
                                                    .Status
                                                    .ToString()
                                        },

                                policy =
                                    notification.Policy == null
                                        ? null
                                        : new
                                        {
                                            notification
                                                .Policy
                                                .PolicyId,

                                            status =
                                                notification
                                                    .Policy
                                                    .Status
                                                    .ToString(),

                                            notification
                                                .Policy
                                                .StartDate,

                                            notification
                                                .Policy
                                                .EndDate
                                        },

                                branch =
                                    notification.Branch == null
                                        ? null
                                        : new
                                        {
                                            notification
                                                .Branch
                                                .BranchId,

                                            notification
                                                .Branch
                                                .BranchName,

                                            notification
                                                .Branch
                                                .Address,

                                            contactNo =
                                                notification
                                                    .Branch
                                                    .ContactNo,

                                            notification
                                                .Branch
                                                .Email
                                        },

                                verifiedByUser =
                                    notification.VerifiedBy == null
                                        ? null
                                        : new
                                        {
                                            notification
                                                .VerifiedBy
                                                .UserId,

                                            notification
                                                .VerifiedBy
                                                .FullName,

                                            notification
                                                .VerifiedBy
                                                .Email
                                        },

                                documentUrl =
                                    $"/api/DeathNotification/{notification.DeathNotificationId}/document"
                            }
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] GetById error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // UPDATE
        // PUT: /api/ServiceRequest/{id}
        // ============================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Client")]
        public IActionResult Update(
            int id,
            [FromBody] UpdateServiceRequestDto request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Update information is required."
                        }
                    );
                }

                var clientResult =
                    ResolveCurrentClient();

                if (clientResult.Error != null)
                {
                    return clientResult.Error;
                }

                var updated =
                    _serviceRequestService.Update(
                        id,
                        clientResult.ClientId!,
                        request
                    );

                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] Update error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // CREATE
        // POST: /api/ServiceRequest
        // ============================================================

        [HttpPost]
        [Authorize(Roles = "Client")]
        public IActionResult Create(
            [FromBody] CreateServiceRequestRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Booking information is required."
                        }
                    );
                }

                var clientResult =
                    ResolveCurrentClient();

                if (clientResult.Error != null)
                {
                    return clientResult.Error;
                }

                var created =
                    _serviceRequestService.Create(
                        clientResult.ClientId!,
                        request
                    );

                Console.WriteLine(
                    $"[ServiceRequestController] Created ServiceRequest: {created.ServiceRequestId}"
                );

                return CreatedAtAction(
                    nameof(GetById),
                    new
                    {
                        id =
                            created.ServiceRequestId
                    },
                    created
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "========================================"
                );

                Console.WriteLine(
                    "[ServiceRequestController] CREATE ERROR"
                );

                Console.WriteLine(ex);

                Console.WriteLine(
                    "========================================"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // DELETE
        // DELETE: /api/ServiceRequest/{id}
        // ============================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Client")]
        public IActionResult Delete(int id)
        {
            try
            {
                var clientResult =
                    ResolveCurrentClient();

                if (clientResult.Error != null)
                {
                    return clientResult.Error;
                }

                _serviceRequestService.Delete(
                    id,
                    clientResult.ClientId!
                );

                return Ok(
                    new
                    {
                        message =
                            "Service request deleted successfully."
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] Delete error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // HELPERS
        // ============================================================

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(
                       ClaimTypes.NameIdentifier
                   )
                   ?? User.FindFirstValue("sub");
        }

        private (
            string? ClientId,
            IActionResult? Error
        ) ResolveCurrentClient()
        {
            var userId =
                GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(
                userId))
            {
                return (
                    null,
                    Unauthorized(
                        new
                        {
                            message =
                                "User identity could not be determined."
                        }
                    )
                );
            }

            var client =
                _clientService
                    .GetClientByUserId(
                        userId
                    );

            if (client == null)
            {
                return (
                    null,
                    NotFound(
                        new
                        {
                            message =
                                "Client record could not be found for the logged-in user."
                        }
                    )
                );
            }

            if (string.IsNullOrWhiteSpace(
                client.ClientId))
            {
                return (
                    null,
                    BadRequest(
                        new
                        {
                            message =
                                "The client record does not have a ClientId."
                        }
                    )
                );
            }

            return (
                client.ClientId,
                null
            );
        }
    }
}
