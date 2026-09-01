// File: Controllers/AppointmentController.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Service.ScheduleManagement;
using PolicyManagement.Service.UserManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;
        private readonly IClientService _clientService;
        private readonly AppDbContext _context;

        public AppointmentController(
            IAppointmentService appointmentService,
            IClientService clientService,
            AppDbContext context)
        {
            _appointmentService = appointmentService;
            _clientService = clientService;
            _context = context;
        }

        // ============================================================
        // CLIENT: CREATE APPOINTMENT
        // POST: /api/Appointment
        // ============================================================

        [HttpPost]
        [Authorize(Roles = "Client")]
        public IActionResult Create(
            [FromBody] CreateAppointmentRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Appointment information is required."
                        });
                }

                var clientResult =
                    ResolveCurrentClient();

                if (clientResult.Error != null)
                {
                    return clientResult.Error;
                }

                var appointment =
                    _appointmentService.Create(
                        clientResult.ClientId!,
                        request);

                return CreatedAtAction(
                    nameof(GetMyAppointment),
                    new
                    {
                        id = appointment.AppointmentId
                    },
                    appointment);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[AppointmentController] Create error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    });
            }
        }

        // ============================================================
        // CLIENT: MY APPOINTMENTS
        // GET: /api/Appointment/my
        // ============================================================

        [HttpGet("my")]
        [Authorize(Roles = "Client")]
        public IActionResult GetMyAppointments()
        {
            try
            {
                var clientResult =
                    ResolveCurrentClient();

                if (clientResult.Error != null)
                {
                    return clientResult.Error;
                }

                var appointments =
                    _appointmentService
                        .GetByClient(
                            clientResult.ClientId!);

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[AppointmentController] GetMyAppointments error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    });
            }
        }

        // ============================================================
        // CLIENT: GET MY APPOINTMENT
        // GET: /api/Appointment/my/{id}
        // ============================================================

        [HttpGet("my/{id:int}")]
        [Authorize(Roles = "Client")]
        public IActionResult GetMyAppointment(
            int id)
        {
            try
            {
                var clientResult =
                    ResolveCurrentClient();

                if (clientResult.Error != null)
                {
                    return clientResult.Error;
                }

                var appointment =
                    _appointmentService
                        .GetById(id);

                if (appointment == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Appointment was not found."
                        });
                }

                if (!string.Equals(
                        appointment.ClientId,
                        clientResult.ClientId,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[AppointmentController] GetMyAppointment error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    });
            }
        }

        // ============================================================
        // CLERK: GET APPOINTMENTS
        //
        // Clerk:
        // - automatically limited to their own branch.
        //
        // Admin:
        // - may optionally provide branchId.
        //
        // GET: /api/Appointment/clerk
        // GET: /api/Appointment/clerk?status=Requested
        // GET: /api/Appointment/clerk?branchId=BRC001
        // ============================================================

        [HttpGet("clerk")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> GetForClerk(
            [FromQuery] string? status,
            [FromQuery] string? branchId,
            CancellationToken cancellationToken)
        {
            try
            {
                var role =
                    GetCurrentRole();

                string? effectiveBranchId =
                    branchId;

                if (string.Equals(
                        role,
                        "Clerk",
                        StringComparison.OrdinalIgnoreCase))
                {
                    var clerkResult =
                        await ResolveCurrentStaffAsync(
                            cancellationToken);

                    if (clerkResult.Error != null)
                    {
                        return clerkResult.Error;
                    }

                    effectiveBranchId =
                        clerkResult.BranchId;
                }

                var appointments =
                    _appointmentService
                        .GetForClerk(
                            effectiveBranchId,
                            status);

                return Ok(appointments);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[AppointmentController] GetForClerk error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    });
            }
        }

        // ============================================================
        // CLERK: GET SINGLE APPOINTMENT
        // GET: /api/Appointment/clerk/{id}
        // ============================================================

        [HttpGet("clerk/{id:int}")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> GetForClerkById(
            int id,
            CancellationToken cancellationToken)
        {
            try
            {
                var appointment =
                    _appointmentService
                        .GetById(id);

                if (appointment == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Appointment was not found."
                        });
                }

                var authorizationResult =
                    await VerifyClerkBranchAccessAsync(
                        appointment,
                        cancellationToken);

                if (authorizationResult != null)
                {
                    return authorizationResult;
                }

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[AppointmentController] GetForClerkById error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    });
            }
        }

        // ============================================================
        // CLERK: AVAILABLE STAFF
        //
        // Optional dateTime allows the UI to check staff availability
        // before submitting a Confirm or Reschedule action.
        //
        // GET:
        // /api/Appointment/clerk/{id}/available-staff
        //
        // GET:
        // /api/Appointment/clerk/{id}/available-staff
        //     ?appointmentDateTime=2026-09-10T10:00:00Z
        // ============================================================

        [HttpGet("clerk/{id:int}/available-staff")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> GetAvailableStaff(
            int id,
            [FromQuery] DateTime? appointmentDateTime,
            CancellationToken cancellationToken)
        {
            try
            {
                var appointment =
                    _appointmentService
                        .GetById(id);

                if (appointment == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Appointment was not found."
                        });
                }

                var authorizationResult =
                    await VerifyClerkBranchAccessAsync(
                        appointment,
                        cancellationToken);

                if (authorizationResult != null)
                {
                    return authorizationResult;
                }

                var staff =
                    _appointmentService
                        .GetAvailableStaff(
                            id,
                            appointmentDateTime);

                var result =
                    staff.Select(x =>
                        new
                        {
                            x.StaffId,

                            fullName =
                                x.User?.FullName,

                            email =
                                x.User?.Email,

                            staffRole =
                                x.StaffRole.ToString(),

                            x.BranchId,

                            branchName =
                                x.Branch?.BranchName,

                            isActive =
                                x.User?.IsActive ?? false
                        });

                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[AppointmentController] GetAvailableStaff error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    });
            }
        }

        // ============================================================
        // CLERK: REVIEW / PROCESS APPOINTMENT
        //
        // Actions:
        // Confirm
        // Reschedule
        // Complete
        // Cancel
        // NoShow
        //
        // PUT: /api/Appointment/clerk/{id}/review
        // ============================================================

        [HttpPut("clerk/{id:int}/review")]
        [Authorize(Roles = "Clerk,Admin")]
        public async Task<IActionResult> Review(
            int id,
            [FromBody] ReviewAppointmentRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Appointment action information is required."
                        });
                }

                var appointment =
                    _appointmentService
                        .GetById(id);

                if (appointment == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Appointment was not found."
                        });
                }

                var authorizationResult =
                    await VerifyClerkBranchAccessAsync(
                        appointment,
                        cancellationToken);

                if (authorizationResult != null)
                {
                    return authorizationResult;
                }

                var updated =
                    _appointmentService
                        .Review(
                            id,
                            request);

                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[AppointmentController] Review error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    });
            }
        }



// ============================================================
// CLIENT: UPDATE MY APPOINTMENT
// PUT: /api/Appointment/my/{id}
// ============================================================

[HttpPut("my/{id:int}")]
[Authorize(Roles = "Client")]
public IActionResult UpdateMyAppointment(
    int id,
    [FromBody] UpdateAppointmentRequest request)
{
    try
    {
        if (request == null)
        {
            return BadRequest(
                new
                {
                    message =
                        "Appointment update information is required."
                });
        }

        var clientResult =
            ResolveCurrentClient();

        if (clientResult.Error != null)
        {
            return clientResult.Error;
        }

        var updated =
            _appointmentService.UpdateForClient(
                id,
                clientResult.ClientId!,
                request);

        return Ok(updated);
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(
            new
            {
                message = ex.Message
            });
    }
    catch (UnauthorizedAccessException ex)
    {
        return StatusCode(
            StatusCodes.Status403Forbidden,
            new
            {
                message = ex.Message
            });
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(
            new
            {
                message = ex.Message
            });
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            $"[AppointmentController] UpdateMyAppointment error: {ex}");

        return StatusCode(
            500,
            new
            {
                message =
                    "Internal server error."
            });
    }
}

// ============================================================
// CLIENT: GET APPOINTMENT BY SERVICE REQUEST
// GET:
// /api/Appointment/my/by-service-request/{serviceRequestId}
// ============================================================

[HttpGet("my/by-service-request/{serviceRequestId:int}")]
[Authorize(Roles = "Client")]
public async Task<IActionResult> GetMyAppointmentByServiceRequest(
    int serviceRequestId,
    CancellationToken cancellationToken)
{
    try
    {
        var clientResult =
            ResolveCurrentClient();

        if (clientResult.Error != null)
        {
            return clientResult.Error;
        }

        var appointment =
            await _context.Appointments
                .AsNoTracking()
                .Include(x => x.ServiceRequest)
                .Include(x => x.Branch)
                .Include(x => x.AssignedStaff)
                .ThenInclude(x => x!.User)
                .FirstOrDefaultAsync(
                    x =>
                        x.ServiceRequestId == serviceRequestId &&
                        x.ClientId == clientResult.ClientId,
                    cancellationToken);

        if (appointment == null)
        {
            return NotFound(
                new
                {
                    message =
                        "Appointment could not be found for this service request."
                });
        }

        return Ok(appointment);
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            $"[AppointmentController] GetMyAppointmentByServiceRequest error: {ex}");

        return StatusCode(
            StatusCodes.Status500InternalServerError,
            new
            {
                message =
                    "Internal server error."
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
                   ?? User.FindFirstValue("sub")
                   ?? User.FindFirstValue("userId");
        }

        private string GetCurrentRole()
        {
            return User.FindFirstValue(
                       ClaimTypes.Role)
                   ?? User.FindFirstValue("role")
                   ?? string.Empty;
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
                        })
                );
            }

            var client =
                _clientService
                    .GetClientByUserId(
                        userId);

            if (client == null)
            {
                return (
                    null,
                    NotFound(
                        new
                        {
                            message =
                                "Client record could not be found for the logged-in user."
                        })
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
                        })
                );
            }

            return (
                client.ClientId,
                null
            );
        }

        private async Task<(
            string? StaffId,
            string? BranchId,
            IActionResult? Error
        )> ResolveCurrentStaffAsync(
            CancellationToken cancellationToken)
        {
            var userId =
                GetCurrentUserId();

            if (string.IsNullOrWhiteSpace(
                    userId))
            {
                return (
                    null,
                    null,
                    Unauthorized(
                        new
                        {
                            message =
                                "User identity could not be determined."
                        })
                );
            }

            var staff =
                await _context.Staff
                    .AsNoTracking()
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(
                        x =>
                            x.UserId == userId,
                        cancellationToken);

            if (staff == null)
            {
                return (
                    null,
                    null,
                    NotFound(
                        new
                        {
                            message =
                                "Staff record could not be found for the logged-in user."
                        })
                );
            }

            if (staff.User == null ||
                !staff.User.IsActive)
            {
                return (
                    null,
                    null,
                    Forbid()
                );
            }

            if (string.IsNullOrWhiteSpace(
                    staff.BranchId))
            {
                return (
                    null,
                    null,
                    BadRequest(
                        new
                        {
                            message =
                                "The Clerk is not assigned to a branch."
                        })
                );
            }

            return (
                staff.StaffId,
                staff.BranchId,
                null
            );
        }

        private async Task<IActionResult?>
            VerifyClerkBranchAccessAsync(
                Appointment appointment,
                CancellationToken cancellationToken)
        {
            var role =
                GetCurrentRole();

            if (string.Equals(
                    role,
                    "Admin",
                    StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var staffResult =
                await ResolveCurrentStaffAsync(
                    cancellationToken);

            if (staffResult.Error != null)
            {
                return staffResult.Error;
            }

            if (!string.Equals(
                    appointment.BranchId,
                    staffResult.BranchId,
                    StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            return null;
        }
    }
}