using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.DTOs.Responses;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Service.JWT;
using PolicyManagement.Service.UserManagement;

namespace PolicyManagement.Services
{
    public class AuthenticationService
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;
        private readonly IPasswordService _passwordService;

        public AuthenticationService(
            AppDbContext context,
            JwtService jwtService,
            IPasswordService passwordService)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordService = passwordService;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var email = request.Email.Trim();

            var user = await _context.Users
                .FirstOrDefaultAsync(
                    u => u.Email.ToLower() == email.ToLower()
                );

            if (user == null)
            {
                return null;
            }

            if (!user.IsActive)
            {
                return null;
            }

            // Make sure the user has set a password
            if (string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                return null;
            }

            // Verify password using our PasswordService
            if (!_passwordService.VerifyPassword(
                    user,
                    user.PasswordHash,
                    request.Password))
            {
                return null;
            }

            user.LastLogin = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var jwt = _jwtService.GenerateToken(user);

            return new LoginResponse
            {
                Token = jwt.Token,
                Expiration = jwt.Expiration,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                UserId = user.UserId,
                IsActive = user.IsActive,
                LastLogin = user.LastLogin
            };
        }
    }
}