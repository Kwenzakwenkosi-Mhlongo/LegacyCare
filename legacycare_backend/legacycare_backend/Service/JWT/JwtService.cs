using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.JWT
{
    public class JwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (string Token, DateTime Expiration) GenerateToken(User user)
        {
            var key = _configuration["JwtSettings:Secret"] ??
                      _configuration["Jwt:Key"] ??
                      "your-super-secret-key-here-min-32-characters-long";

            var issuer = _configuration["JwtSettings:Issuer"] ??
                         _configuration["Jwt:Issuer"] ??
                         "LegacyCareAPI";

            var audience = _configuration["JwtSettings:Audience"] ??
                           _configuration["Jwt:Audience"] ??
                           "LegacyCareClient";

            var expiryMinutes = Convert.ToDouble(
                _configuration["JwtSettings:ExpiryMinutes"] ??
                _configuration["Jwt:ExpiryMinutes"] ??
                "60"
            );

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var expiration = DateTime.UtcNow.AddMinutes(expiryMinutes);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiration,
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return (tokenString, expiration);
        }
    }
}