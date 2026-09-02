// File:
// legacycare_backend/legacycare_backend/
// Controllers/UserManagement/ClientController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Service.UserManagement;
using System.Security.Claims;

namespace PolicyManagement.Controllers.UserManagement
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly AppDbContext _context;

        public ClientController(
            IClientService clientService,
            AppDbContext context)
        {
            _clientService = clientService;
            _context = context;
        }

        // =========================================================
        // GET ALL CLIENTS
        // Admin use
        // =========================================================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public IActionResult GetAllClients()
        {
            try
            {
                var clients =
                    _clientService.GetAllClients();

                return Ok(clients);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        // =========================================================
        // GET LOGGED-IN CLIENT
        // Client dashboard
        // =========================================================

        [HttpGet("me")]
        [Authorize(Roles = "Client")]
        public IActionResult GetMyClient()
        {
            try
            {
                var userId =
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(
                        new
                        {
                            message =
                                "User ID was not found in the token."
                        });
                }

                var client =
                    _clientService
                        .GetClientByUserId(
                            userId);

                return Ok(client);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        // =========================================================
        // GET LOGGED-IN CLIENT REPORT DETAILS
        // Used by downloadable client reports
        // =========================================================

        [HttpGet("me/report-details")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetMyReportDetails(
            CancellationToken cancellationToken)
        {
            try
            {
                var userId =
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier);

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(
                        new
                        {
                            message =
                                "User ID was not found in the token."
                        });
                }

                var client =
                    await _context.Client
                        .AsNoTracking()
                        .Where(item =>
                            item.UserId == userId)
                        .Select(item => new
                        {
                            ClientId =
                                item.ClientId ??
                                string.Empty,

                            FullName =
                                item.User.FullName,

                            Email =
                                item.User.Email,

                            CellNo =
                                item.User.CellNo,

                            Address =
                                item.User.Address
                        })
                        .FirstOrDefaultAsync(
                            cancellationToken);

                if (client == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Client record was not found."
                        });
                }

                var displayClientId =
                    int.TryParse(
                        client.ClientId,
                        out var numericClientId)
                        ? $"CL{numericClientId:D3}"
                        : client.ClientId;

                return Ok(
                    new
                    {
                        clientId =
                            client.ClientId,

                        displayClientId,

                        fullName =
                            client.FullName,

                        email =
                            client.Email,

                        cellNo =
                            client.CellNo,

                        address =
                            client.Address
                    });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ClientController] Report details error: {ex}");

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to load client report details."
                    });
            }
        }

        // =========================================================
        // GET CLIENT BY CLIENT ID
        // Admin use
        // =========================================================

        [HttpGet("{clientId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetClientById(
            string clientId)
        {
            try
            {
                var client =
                    _clientService
                        .GetClientById(
                            clientId);

                return Ok(client);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        // =========================================================
        // CREATE CLIENT
        // Admin use
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult CreateClient(
            [FromBody] Client client)
        {
            try
            {
                if (client == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Client information is required."
                        });
                }

                var createdClient =
                    _clientService
                        .CreateClient(
                            client);

                return Ok(createdClient);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        // =========================================================
        // UPDATE CLIENT
        // Admin use
        // =========================================================

        [HttpPut("{clientId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult UpdateClient(
            string clientId,
            [FromBody]
            PolicyManagement.DTOs.Requests.UpdateClientRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Client update information is required."
                        });
                }

                _clientService.UpdateClient(
                    clientId,
                    request);

                return Ok(
                    new
                    {
                        message =
                            "Client updated successfully."
                    });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        // =========================================================
        // ACTIVATE CLIENT
        // Admin use
        // =========================================================

        [HttpPut("{clientId}/activate")]
        [Authorize(Roles = "Admin")]
        public IActionResult ActivateClient(
            string clientId)
        {
            try
            {
                _clientService
                    .ActivateClient(
                        clientId);

                return Ok(
                    new
                    {
                        message =
                            "Client activated successfully."
                    });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = ex.Message
                    });
            }
        }

        // =========================================================
        // DELETE CLIENT
        // Admin use
        // =========================================================

        [HttpDelete("{clientId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteClient(
            string clientId)
        {
            try
            {
                _clientService
                    .DeleteClient(
                        clientId);

                return Ok(
                    new
                    {
                        message =
                            "Client deleted successfully."
                    });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        message = ex.Message
                    });
            }
        }
    }
}