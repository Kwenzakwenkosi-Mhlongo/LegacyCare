using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Service.UserManagement;
using PolicyManagement.Services;
using PolicyManagement.Enums;
using System.Security.Cryptography;

namespace PolicyManagement.Controllers.UserManagement
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class ClientController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly IUserService _userService;
        private readonly IClientValidationService _clientValidationService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public ClientController(
            IClientService clientService,
            IUserService userService,
            IClientValidationService clientValidationService,
            IEmailService emailService,
            AppDbContext context,
            IConfiguration configuration)
        {
            _clientService = clientService;
            _userService = userService;
            _clientValidationService = clientValidationService;
            _emailService = emailService;
            _context = context;
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult GetAllClients()
        {
            return Ok(_clientService.GetAllClients());
        }

        [HttpGet("{clientId}")]
        public IActionResult GetClientById(string clientId)
        {
            var client = _clientService.GetClientById(clientId);

            if (client == null)
            {
                return NotFound("Client not found.");
            }

            return Ok(client);
        }

        [HttpPost]
        public async Task<IActionResult> CreateClient(
            [FromBody] CreateClientRequest request)
        {
            var validationError = _clientValidationService.Validate(request);

            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            // Create user without a password.
            // The client will create their own password.
            var user = new User
            {
                FullName = request.FullName,
                IDNumber = request.IdNumber,
                Email = request.Email,
                PasswordHash = string.Empty,
                CellNo = request.CellNo,
                Address = request.Address,
                Role = UserRole.Client
            };

            var createdUser = _userService.CreateUserWithoutPassword(user);

            // Create client
            var client = new Client
            {
                UserId = createdUser.UserId
            };

            var createdClient = _clientService.CreateClient(client);

            // Generate secure password setup token
            var tokenBytes = RandomNumberGenerator.GetBytes(32);
            var token = Convert.ToBase64String(tokenBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");

            // Token expires after 24 hours
            var passwordSetupToken = new PasswordSetupToken
            {
                UserId = createdUser.UserId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                Used = false
            };

            _context.PasswordSetupTokens.Add(passwordSetupToken);
            await _context.SaveChangesAsync();

            // Get frontend URL from configuration
            var frontendUrl =
                _configuration["FrontendUrl"]
                ?? "http://localhost:3000";

            // Password setup page
            var setupLink =
                $"{frontendUrl}/set-password?token={Uri.EscapeDataString(token)}";

            // Send email
            await _emailService.SendPasswordSetupEmailAsync(
                createdUser.Email,
                createdUser.FullName,
                setupLink
            );

            return Ok(new
            {
                Client = createdClient,
                Message = "Client created successfully. A password setup email has been sent."
            });
        }

        [HttpPut("{clientId}")]
        public IActionResult UpdateClient(
            string clientId,
            UpdateClientRequest request)
        {
            var client = _clientService.GetClientById(clientId);

            if (client == null)
            {
                return NotFound("Client not found.");
            }

            var validationError =
                _clientValidationService.ValidateUpdate(
                    request,
                    client.UserId
                );

            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            _clientService.UpdateClient(clientId, request);

            return Ok();
        }

        [HttpDelete("{clientId}")]
        public IActionResult DeleteClient(string clientId)
        {
            var client = _clientService.GetClientById(clientId);

            if (client == null)
            {
                return NotFound("Client not found.");
            }

            _clientService.DeleteClient(clientId);

            return NoContent();
        }

        [HttpPut("{clientId}/activate")]
        public IActionResult ActivateClient(string clientId)
        {
            var client = _clientService.GetClientById(clientId);

            if (client == null)
            {
                return NotFound("Client not found.");
            }

            _clientService.ActivateClient(clientId);

            return NoContent();
        }
    }
}