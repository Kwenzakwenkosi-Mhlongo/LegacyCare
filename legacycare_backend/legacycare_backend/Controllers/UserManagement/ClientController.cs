using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.UserManagement;
using PolicyManagement.Utilities;
using Microsoft.AspNetCore.Authorization;

namespace PolicyManagement.Controllers.UserManagement
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class ClientController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly IUserService _userService;
        private readonly IPasswordService _passwordService;
        private readonly IClientValidationService _clientValidationService;


        public ClientController(
            IClientService clientService,
            IUserService userService, 
            IPasswordService passwordService,
            IClientValidationService clientValidationService)
        {
            _clientService = clientService;
            _userService = userService;
            _passwordService = passwordService;
            _clientValidationService = clientValidationService;
        }

        [HttpGet]
        public IActionResult GetAllClients()
        {
           return Ok(_clientService.GetAllClients());
            

        }

        [HttpGet("{clientId}")]
        public IActionResult GetClientById(string clientId)
        {
            return Ok(_clientService.GetClientById(clientId));
        }

        [HttpPost]
        public IActionResult CreateClient(CreateClientRequest request)
        {
            var validationError = _clientValidationService.Validate(request);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }
            string generatedPassword = PasswordGenerator.Generate();
            // Create User
            var user = new User
            {
                FullName = request.FullName,
                IDNumber = request.IdNumber,
                Email = request.Email,
                PasswordHash = string.Empty,
                CellNo = request.CellNo,
                Address = request.Address,
                //Automatically Assign Client Role
                Role = Enums.UserRole.Client
            };

            user.PasswordHash = _passwordService.HashPassword(
                user, generatedPassword
            );

            var createdUser = _userService.CreateUser(user);

            // Create Client
            var client = new Client
            {
                UserId = createdUser.UserId
            };

            var createdClient = _clientService.CreateClient(client);

            return Ok(//change back to createdClient
            new {Client = createdClient,
            TemporaryPassword = generatedPassword
            });
        }

        [HttpPut("{clientId}")]
        public IActionResult UpdateClient(string clientId, UpdateClientRequest request)
        {
            var client = _clientService.GetClientById(clientId);
            var validationErrror = _clientValidationService.ValidateUpdate(request, client.UserId);
            
            if (validationErrror != null)
            {
                return BadRequest(validationErrror);
            }

            _clientService.UpdateClient(clientId, request);   
            return Ok();
        }

        [HttpDelete("{clientId}")]
        public IActionResult DeleteClient(string clientId)
        {
            _clientService.DeleteClient(clientId);
            return NoContent();
        }

        [HttpPut("{clientId}/activate")]
        public IActionResult ActivateClient(string clientId)
        {
            _clientService.ActivateClient(clientId);

            return NoContent();
        }
    }
}