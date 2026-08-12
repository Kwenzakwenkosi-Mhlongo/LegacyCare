using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Services;

namespace PolicyManagement.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly AuthenticationService _authenticationService;
        private readonly AppDbContext _context;

        public AuthenticationController(AuthenticationService authenticationService, AppDbContext context)
        {
            _authenticationService = authenticationService;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authenticationService.LoginAsync(request);

            if (response == null)
            {
                return Unauthorized(new
                {
                    Message = "Invalid email or password."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            return Ok(new
            {
                response.Token,
                response.Expiration,
                response.FullName,
                response.Email,
                response.Role,
                UserId = user?.UserId,
                response.IsActive,
                response.LastLogin
            });
        }
    }
}