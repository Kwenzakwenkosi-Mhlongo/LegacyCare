using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Data;
using PolicyManagement.Enums;

namespace PolicyManagement.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            var stats = new
            {
                totalClients = _context.Users.Count(u => u.Role == UserRole.Client),
                totalStaff = _context.Users.Count(u => u.Role == UserRole.Staff),
                totalEvents = _context.Event.Count(),
                totalTasks = _context.Task.Count(),
                totalPolicies = _context.Policy.Count(),
                totalPayments = _context.Payment.Count()
            };

            return Ok(stats);
        }
    }
} 