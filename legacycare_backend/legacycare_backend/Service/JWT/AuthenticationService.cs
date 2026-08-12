using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.DTOs.Responses;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Service.JWT;

namespace PolicyManagement.Services
{
    public class AuthenticationService
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;
        private readonly PasswordHasher<User> _passwordHasher;

        public AuthenticationService(
            AppDbContext context,
            JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return null;
            }

            if (!user.IsActive)
            {
                return null;
            }

            var verificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password);

            if (verificationResult == PasswordVerificationResult.Failed)
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