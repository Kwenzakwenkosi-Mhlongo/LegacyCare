using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Services;
using PolicyManagement.Service.UserManagement;

namespace PolicyManagement.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly AuthenticationService _authenticationService;
        private readonly AppDbContext _context;
        private readonly IPasswordService _passwordService;

        public AuthenticationController(
            AuthenticationService authenticationService,
            AppDbContext context,
            IPasswordService passwordService)
        {
            _authenticationService = authenticationService;
            _context = context;
            _passwordService = passwordService;
        }

        // =========================
        // LOGIN
        // =========================
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

        // =========================
        // SET PASSWORD
        // =========================
        [HttpPost("set-password")]
        public async Task<IActionResult> SetPassword(
            [FromBody] SetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Find token
            var passwordToken = await _context.PasswordSetupTokens
                .FirstOrDefaultAsync(t => t.Token == request.Token);

            if (passwordToken == null)
            {
                return BadRequest(new
                {
                    Message = "Invalid password setup link."
                });
            }

            // Check if token was already used
            if (passwordToken.Used)
            {
                return BadRequest(new
                {
                    Message = "This password setup link has already been used."
                });
            }

            // Check expiry
            if (passwordToken.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    Message = "This password setup link has expired."
                });
            }

            // Find user
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == passwordToken.UserId);

            if (user == null)
            {
                return BadRequest(new
                {
                    Message = "User account could not be found."
                });
            }

            // Validate password
            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new
                {
                    Message = "Password cannot be empty."
                });
            }

            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new
                {
                    Message = "Password must be at least 8 characters long."
                });
            }

            // Hash the new password
            string passwordHash = _passwordService.HashPassword(
                user,
                request.NewPassword
            );

            user.ChangePassword(passwordHash);

            // Mark token as used
            passwordToken.Used = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Password set successfully. You can now log in."
            });
        }
    }
}