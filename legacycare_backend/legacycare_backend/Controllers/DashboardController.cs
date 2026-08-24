using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Service.DashboardManagement;

namespace PolicyManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }


        // =====================================================
        // ADMIN DASHBOARD
        // GET: /api/Dashboard
        // =====================================================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public IActionResult GetDashboard()
        {
            return Ok(_dashboardService.GetDashboardData());
        }


        // =====================================================
        // PROFILE STATS
        // GET: /api/Dashboard/stats
        // =====================================================

        [HttpGet("stats")]
        public IActionResult GetDashboardStats()
        {
            return Ok(_dashboardService.GetDashboardStats());
        }
    }
}