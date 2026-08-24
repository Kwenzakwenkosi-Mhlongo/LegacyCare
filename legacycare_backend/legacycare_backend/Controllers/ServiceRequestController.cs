using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.ServiceRequestManagement;
using PolicyManagement.Service.UserManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ServiceRequestController : ControllerBase
    {
        private readonly IServiceRequestService _serviceRequestService;
        private readonly IClientService _clientService;

        public ServiceRequestController(
            IServiceRequestService serviceRequestService,
            IClientService clientService)
        {
            _serviceRequestService = serviceRequestService;
            _clientService = clientService;
        }

        // ============================================================
        // GET ALL
        // GET: /api/ServiceRequest
        // ============================================================

        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                return Ok(
                    _serviceRequestService.GetAll()
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] GetAll error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // GET MY REQUESTS
        // GET: /api/ServiceRequest/my
        // ============================================================

        [HttpGet("my")]
        public IActionResult GetMyRequests()
        {
            return GetClientRequests();
        }

        // ============================================================
        // GET CLIENT REQUESTS
        // GET: /api/ServiceRequest/client
        // ============================================================

        [HttpGet("client")]
        public IActionResult GetClientRequests()
        {
            try
            {
                // ----------------------------------------------------
                // Get logged-in USER ID from JWT
                // ----------------------------------------------------

                var userId =
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier
                    )
                    ?? User.FindFirstValue("sub");

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(
                        new
                        {
                            message =
                                "User identity could not be determined."
                        }
                    );
                }

                Console.WriteLine(
                    $"[ServiceRequestController] JWT UserId: {userId}"
                );

                // ----------------------------------------------------
                // Find the Client belonging to this User
                // ----------------------------------------------------

                var client =
                    _clientService.GetClientByUserId(userId);

                if (client == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Client record could not be found for the logged-in user."
                        }
                    );
                }

                // ----------------------------------------------------
                // IMPORTANT:
                //
                // ServiceRequest.ClientId stores ClientId,
                // NOT UserId.
                // ----------------------------------------------------

                var clientId = client.ClientId;

                if (string.IsNullOrWhiteSpace(clientId))
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "The client record does not have a ClientId."
                        }
                    );
                }

                Console.WriteLine(
                    $"[ServiceRequestController] Resolved ClientId: {clientId}"
                );

                // ----------------------------------------------------
                // Load service requests for this ClientId
                // ----------------------------------------------------

                var requests =
                    _serviceRequestService.GetByClient(
                        clientId
                    );

                Console.WriteLine(
                    $"[ServiceRequestController] Requests found: {requests.Count()}"
                );

                return Ok(requests);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] GetClientRequests error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // GET BY ID
        // GET: /api/ServiceRequest/{id}
        // ============================================================

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var request =
                    _serviceRequestService.GetById(id);

                if (request == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Service request was not found."
                        }
                    );
                }

                return Ok(request);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] GetById error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message = "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // UPDATE
        // PUT: /api/ServiceRequest/{id}
        // ============================================================

        [HttpPut("{id:int}")]
        public IActionResult Update(
            int id,
            [FromBody] UpdateServiceRequestDto request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(
                        new
                        {
                            message =
                                "Update information is required."
                        }
                    );
                }

                // ----------------------------------------------------
                // Resolve actual ClientId
                // ----------------------------------------------------

                var userId =
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier
                    )
                    ?? User.FindFirstValue("sub");

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(
                        new
                        {
                            message =
                                "User identity could not be determined."
                        }
                    );
                }

                var client =
                    _clientService.GetClientByUserId(userId);

                if (client == null ||
                    string.IsNullOrWhiteSpace(client.ClientId))
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Client record could not be found."
                        }
                    );
                }

                var updated =
                    _serviceRequestService.Update(
                        id,
                        client.ClientId,
                        request
                    );

                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] Update error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    }
                );
            }
        }

        // ============================================================
        // DELETE
        // DELETE: /api/ServiceRequest/{id}
        // ============================================================

        [HttpDelete("{id:int}")]
        public IActionResult Delete(int id)
        {
            try
            {
                var userId =
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier
                    )
                    ?? User.FindFirstValue("sub");

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(
                        new
                        {
                            message =
                                "User identity could not be determined."
                        }
                    );
                }

                var client =
                    _clientService.GetClientByUserId(userId);

                if (client == null ||
                    string.IsNullOrWhiteSpace(client.ClientId))
                {
                    return NotFound(
                        new
                        {
                            message =
                                "Client record could not be found."
                        }
                    );
                }

                _serviceRequestService.Delete(
                    id,
                    client.ClientId
                );

                return Ok(
                    new
                    {
                        message =
                            "Service request deleted successfully."
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[ServiceRequestController] Delete error: {ex}"
                );

                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Internal server error."
                    }
                );
            }
        }
    }
}