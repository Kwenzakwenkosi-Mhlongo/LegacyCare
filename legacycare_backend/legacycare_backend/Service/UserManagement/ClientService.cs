using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.UserManagement;
using System.Security.Cryptography;

namespace PolicyManagement.Service.UserManagement
{
    public class ClientService : IClientService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public ClientService(
            AppDbContext context,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }


        // =========================================================
        // ADMIN - GET ALL CLIENTS
        // =========================================================

        public IEnumerable<Client> GetAllClients()
        {
            return _context.Client
                .Include(c => c.User)
                .AsEnumerable()
                .OrderBy(c =>
                    int.TryParse(c.ClientId, out int id) ? id : 0)
                .ToList();
        }


        // =========================================================
        // ADMIN - GET CLIENT BY CLIENT ID
        // =========================================================

        public Client GetClientById(string clientId)
        {
            var client = _context.Client
                .Include(c => c.User)
                .FirstOrDefault(c => c.ClientId == clientId);

            if (client == null)
            {
                throw new KeyNotFoundException(
                    "Client not found."
                );
            }

            return client;
        }


        // =========================================================
        // CLIENT - GET LOGGED-IN CLIENT
        // =========================================================

        public Client GetClientByUserId(string userId)
        {
            var client = _context.Client
                .Include(c => c.User)
                .FirstOrDefault(c => c.UserId == userId);

            if (client == null)
            {
                throw new KeyNotFoundException(
                    "Client account not found."
                );
            }

            return client;
        }


        // =========================================================
        // CREATE CLIENT
        // Creates client + password setup token + email
        // =========================================================

        public Client CreateClient(Client client)
        {
            if (client == null)
            {
                throw new ArgumentNullException(
                    nameof(client),
                    "Client information is required."
                );
            }

            if (client.User == null)
            {
                throw new InvalidOperationException(
                    "Client user information is required."
                );
            }

            if (string.IsNullOrWhiteSpace(client.User.Email))
            {
                throw new InvalidOperationException(
                    "Client email address is required."
                );
            }

            if (string.IsNullOrWhiteSpace(client.User.FullName))
            {
                throw new InvalidOperationException(
                    "Client full name is required."
                );
            }


            // -----------------------------------------------------
            // Generate Client ID
            // -----------------------------------------------------

            client.ClientId = GenerateClientId();


            // -----------------------------------------------------
            // Prepare User
            // -----------------------------------------------------

            client.User.UserId = Guid.NewGuid().ToString();

            client.User.Role = UserRole.Client;

            client.User.IsActive = true;

            client.User.DateCreated = DateTime.UtcNow;

            // No password yet.
            // Client will create it using the email link.
            client.User.PasswordHash = null;


            // -----------------------------------------------------
            // Generate password setup token
            // -----------------------------------------------------

            var token = Convert.ToBase64String(
                RandomNumberGenerator.GetBytes(32)
            )
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");


            var passwordSetupToken = new PasswordSetupToken
            {
                Id = Guid.NewGuid().ToString(),
                UserId = client.User.UserId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                Used = false
            };


            // -----------------------------------------------------
            // Save Client + User + Token
            // -----------------------------------------------------

            _context.Client.Add(client);

            _context.PasswordSetupTokens.Add(
                passwordSetupToken
            );

            _context.SaveChanges();


            // -----------------------------------------------------
            // Build password setup URL
            // -----------------------------------------------------

            var frontendUrl =
                _configuration["FrontendUrl"];

            if (string.IsNullOrWhiteSpace(frontendUrl))
            {
                throw new InvalidOperationException(
                    "FrontendUrl is not configured."
                );
            }

            frontendUrl = frontendUrl.TrimEnd('/');

            var setupLink =
                $"{frontendUrl}/set-password?token={Uri.EscapeDataString(token)}";


            // -----------------------------------------------------
            // Send password setup email
            // -----------------------------------------------------

            _emailService.SendPasswordSetupEmailAsync(
                client.User.Email,
                client.User.FullName,
                setupLink
            ).GetAwaiter().GetResult();


            return client;
        }


        // =========================================================
        // UPDATE CLIENT
        // =========================================================

        public bool UpdateClient(
            string clientId,
            UpdateClientRequest request)
        {
            var client = GetClientById(clientId);

            client.User.FullName = request.FullName;
            client.User.IDNumber = request.IdNumber;
            client.User.Email = request.Email;
            client.User.CellNo = request.CellNo;
            client.User.Address = request.Address;
            client.User.IsActive = request.IsActive;

            _context.SaveChanges();

            return true;
        }


        // =========================================================
        // DELETE CLIENT
        // =========================================================

        public void DeleteClient(string clientId)
        {
            var client = GetClientById(clientId);

            var user = client.User;

            // Delete password setup tokens
            var passwordTokens = _context.PasswordSetupTokens
                .Where(t => t.UserId == user.UserId)
                .ToList();

            if (passwordTokens.Any())
            {
                _context.PasswordSetupTokens
                    .RemoveRange(passwordTokens);
            }

            // Delete client
            _context.Client.Remove(client);

            // Delete user
            _context.Users.Remove(user);

            _context.SaveChanges();
        }


        // =========================================================
        // ACTIVATE CLIENT
        // =========================================================

        public void ActivateClient(string clientId)
        {
            var client = GetClientById(clientId);

            client.User.ActivateAccount();

            _context.SaveChanges();
        }


        // =========================================================
        // GENERATE CLIENT ID
        // =========================================================

        private string GenerateClientId()
        {
            var maxId = _context.Client
                .AsEnumerable()
                .Select(c =>
                    int.TryParse(c.ClientId, out int id)
                        ? id
                        : 0)
                .DefaultIfEmpty(0)
                .Max();

            return (maxId + 1).ToString();
        }
    }
}