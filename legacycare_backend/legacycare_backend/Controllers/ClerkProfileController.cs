// File: Controllers/ClerkProfileController.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Clerk,Admin")]
    public class ClerkProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClerkProfileController(
            AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile(
            CancellationToken cancellationToken)
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

                var staff =
                    await _context
                        .Staff
                        .AsNoTracking()
                        .Include(x => x.User)
                        .Include(x => x.Branch)
                        .FirstOrDefaultAsync(
                            x =>
                                x.UserId == userId,
                            cancellationToken);

                if (staff == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Staff profile was not found."
                    });
                }

                if (staff.User == null)
                {
                    return NotFound(new
                    {
                        message =
                            "The user account linked to this staff profile was not found."
                    });
                }

                return Ok(new
                {
                    userId =
                        staff.UserId,

                    staffId =
                        staff.StaffId,

                    displayStaffId =
                        staff.DisplayStaffId,

                    fullName =
                        staff.User.FullName,

                    email =
                        staff.User.Email,

                    role =
                        staff.User.Role.ToString(),

                    staffRole =
                        staff.StaffRole.ToString(),

                    branchId =
                        staff.BranchId,

                    branchName =
                        staff.Branch?.BranchName
                        ?? "Branch not available",

                    hireDate =
                        staff.HireDate,

                    isCovered =
                        staff.IsCovered,

                    isActive =
                        staff.User.IsActive
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "[CLERK PROFILE] ERROR");

                Console.WriteLine(ex);

                return StatusCode(500, new
                {
                    message =
                        "Unable to load clerk profile.",

                    error =
                        ex.Message
                });
            }
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(
                       ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue(
                       "sub")
                   ?? User.FindFirstValue(
                       "userId");
        }
    }
}