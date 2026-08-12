using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Service.UserManagement;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.DTOs.Responses;
using System.Security.Claims;

namespace PolicyManagement.Controllers.UserManagement
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public IActionResult GetAllUsers()
        {
            return Ok(_userService.GetAllUsers());
        }

        [HttpGet("{userId}")]
        public IActionResult GetUserById(string userId)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "Admin" && userId != currentUserId)
                {
                    return Forbid();
                }

                var user = _userService.GetUserById(userId);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                var response = new UserResponse
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    Email = user.Email,
                    IDNumber = user.IDNumber,
                    CellNo = user.CellNo,
                    Address = user.Address,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    DateCreated = user.DateCreated,
                    LastLogin = user.LastLogin
                };

                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("email/{email}")]
        public IActionResult GetUserByEmail(string email)
        {
            try
            {
                return Ok(_userService.GetUserByEmail(email));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult CreateUser([FromBody] User user)
        {
            try
            {
                var createdUser = _userService.CreateUser(user);
                return CreatedAtAction(
                    nameof(GetUserById),
                    new { userId = createdUser.UserId },
                    createdUser);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{userId}")]
        public IActionResult UpdateUser(string userId, [FromBody] User user)
        {
            try
            {
                var updatedUser = _userService.UpdateUser(userId, user);
                return Ok(updatedUser);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("profile/password")]
        public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                _userService.ChangePassword(userId, request.CurrentPassword, request.NewPassword);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                return Ok(_userService.GetProfile(userId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{userId}/activate")]
        public IActionResult ActivateUser(string userId)
        {
            try
            {
                _userService.ActivateUser(userId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{userId}/deactivate")]
        public IActionResult DeactivateUser(string userId)
        {
            try
            {
                _userService.DeactivateUser(userId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{userId}")]
        public IActionResult DeleteUser(string userId)
        {
            try
            {
                _userService.DeleteUser(userId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("exists/email/{email}")]
        public IActionResult EmailExists(string email)
        {
            return Ok(new { exists = _userService.EmailExists(email) });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("exists/idnumber/{idNumber}")]
        public IActionResult IdNumberExists(string idNumber)
        {
            return Ok(new { exists = _userService.IdNumberExists(idNumber) });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("exists/cellno/{cellNo}")]
        public IActionResult CellNoExists(string cellNo)
        {
            return Ok(new { exists = _userService.CellNoExists(cellNo) });
        }
    }
}