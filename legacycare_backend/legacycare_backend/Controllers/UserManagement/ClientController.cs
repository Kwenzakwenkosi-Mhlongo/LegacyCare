using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Service.UserManagement;
using System.Security.Claims;

namespace PolicyManagement.Controllers.UserManagement
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientController : ControllerBase
    {
        private readonly IClientService _clientService;

        public ClientController(IClientService clientService)
        {
            _clientService = clientService;
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
                var clients = _clientService.GetAllClients();

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
        // GET CLIENT BY CLIENT ID
        // Admin use
        // =========================================================

        [HttpGet("{clientId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetClientById(string clientId)
        {
            try
            {
                var client =
                    _clientService.GetClientById(clientId);

                return Ok(client);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
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
                    return Unauthorized(new
                    {
                        message = "User ID was not found in the token."
                    });
                }

                var client =
                    _clientService.GetClientByUserId(userId);

                return Ok(client);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
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
        // UPDATE CLIENT
        // =========================================================

        [HttpPut("{clientId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult UpdateClient(
            string clientId,
            [FromBody] PolicyManagement.DTOs.Requests.UpdateClientRequest request)
        {
            try
            {
                var result =
                    _clientService.UpdateClient(
                        clientId,
                        request);

                return Ok(new
                {
                    message = "Client updated successfully."
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
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
        // =========================================================

        [HttpPut("{clientId}/activate")]
        [Authorize(Roles = "Admin")]
        public IActionResult ActivateClient(
            string clientId)
        {
            try
            {
                _clientService.ActivateClient(clientId);

                return Ok(new
                {
                    message = "Client activated successfully."
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
        }


        // =========================================================
        // DELETE CLIENT
        // =========================================================

        [HttpDelete("{clientId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteClient(
            string clientId)
        {
            try
            {
                _clientService.DeleteClient(clientId);

                return Ok(new
                {
                    message = "Client deleted successfully."
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new
                {
                    message = ex.Message
                });
            }
        }
    }
}