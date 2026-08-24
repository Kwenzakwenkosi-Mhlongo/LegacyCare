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

        public (string Token, DateTime Expiration) GenerateToken(
            User user,
            string? clientId = null)
        {
            // ========================================================
            // JWT SETTINGS
            // ========================================================

            var key =
                _configuration["JwtSettings:Secret"]
                ?? _configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException(
                    "JWT secret is missing. Configure 'JwtSettings:Secret' or 'Jwt:Key'."
                );
            }

            if (Encoding.UTF8.GetBytes(key).Length < 32)
            {
                throw new InvalidOperationException(
                    "JWT secret must be at least 32 bytes long."
                );
            }

            var issuer =
                _configuration["JwtSettings:Issuer"]
                ?? _configuration["Jwt:Issuer"]
                ?? "LegacyCareAPI";

            var audience =
                _configuration["JwtSettings:Audience"]
                ?? _configuration["Jwt:Audience"]
                ?? "LegacyCareClient";

            var expiryMinutes =
                Convert.ToDouble(
                    _configuration["JwtSettings:ExpiryMinutes"]
                    ?? _configuration["Jwt:ExpiryMinutes"]
                    ?? "60"
                );

            // ========================================================
            // SIGNING KEY
            // ========================================================

            var securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key)
                );

            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256
                );

            // ========================================================
            // CLAIMS
            // ========================================================

            var claims = new List<Claim>
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.UserId
                ),

                new Claim(
                    ClaimTypes.Name,
                    user.FullName
                ),

                new Claim(
                    ClaimTypes.Email,
                    user.Email
                ),

                new Claim(
                    ClaimTypes.Role,
                    user.Role.ToString()
                )
            };

            // ========================================================
            // CLIENT ID
            //
            // Important for Client users.
            // Example:
            // UserId   = USR006
            // ClientId = CLN006
            // ========================================================

            if (!string.IsNullOrWhiteSpace(clientId))
            {
                claims.Add(
                    new Claim(
                        "ClientId",
                        clientId
                    )
                );
            }

            // ========================================================
            // EXPIRATION
            // ========================================================

            var expiration =
                DateTime.UtcNow.AddMinutes(
                    expiryMinutes
                );

            // ========================================================
            // CREATE TOKEN
            // ========================================================

            var token =
                new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: expiration,
                    signingCredentials: credentials
                );

            // ========================================================
            // SERIALIZE TOKEN
            // ========================================================

            var tokenString =
                new JwtSecurityTokenHandler()
                    .WriteToken(token);

            return (
                tokenString,
                expiration
            );
        }
    }
}