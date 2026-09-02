// File:
// legacycare_backend/legacycare_backend/Controllers/UserManagement/UserController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.DTOs.Responses;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Service.UserManagement;
using System.Security.Claims;

namespace PolicyManagement.Controllers.UserManagement
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IProfilePictureService _profilePictureService;
        private readonly AppDbContext _context;

        public UserController(
            IUserService userService,
            IProfilePictureService profilePictureService,
            AppDbContext context)
        {
            _userService = userService;
            _profilePictureService = profilePictureService;
            _context = context;
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
                var currentUserId =
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var userRole =
                    User.FindFirst(ClaimTypes.Role)?.Value;

                if (
                    userRole != "Admin" &&
                    userId != currentUserId)
                {
                    return Forbid();
                }

                var user =
                    _userService.GetUserById(userId);

                if (user == null)
                {
                    return NotFound("User not found.");
                }

                var response =
                    new UserResponse
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
                return Ok(
                    _userService.GetUserByEmail(email));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult CreateUser(
            [FromBody] User user)
        {
            try
            {
                var createdUser =
                    _userService.CreateUser(user);

                return CreatedAtAction(
                    nameof(GetUserById),
                    new
                    {
                        userId = createdUser.UserId
                    },
                    createdUser);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{userId}")]
        public IActionResult UpdateUser(
            string userId,
            [FromBody] User user)
        {
            try
            {
                var updatedUser =
                    _userService.UpdateUser(
                        userId,
                        user);

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
        public IActionResult ChangePassword(
            [FromBody] ChangePasswordRequest request)
        {
            var userId =
                User.FindFirst(
                    ClaimTypes.NameIdentifier)
                    ?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                _userService.ChangePassword(
                    userId,
                    request.CurrentPassword,
                    request.NewPassword);

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
            var userId =
                User.FindFirst(
                    ClaimTypes.NameIdentifier)
                    ?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                return Ok(
                    _userService.GetProfile(userId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

       [HttpPost("profile/picture")]
[Consumes("multipart/form-data")]
[RequestSizeLimit(2 * 1024 * 1024)]
public async Task<IActionResult> UploadProfilePicture(
    [FromForm] ProfilePictureUploadRequest request,
    CancellationToken cancellationToken)
{
    var userId =
        User.FindFirst(
            ClaimTypes.NameIdentifier)
            ?.Value;

    if (string.IsNullOrWhiteSpace(userId))
    {
        return Unauthorized(new
        {
            message =
                "User ID was not found in the authentication token."
        });
    }

    if (
        request.File == null ||
        request.File.Length == 0)
    {
        return BadRequest(new
        {
            message =
                "Please select a profile picture."
        });
    }

    string? newBlobName = null;

    try
    {
        var user =
            await _context
                .Set<User>()
                .FirstOrDefaultAsync(
                    item =>
                        item.UserId == userId,
                    cancellationToken);

        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "User account was not found."
            });
        }

        var oldBlobName =
            user.ProfilePictureBlobName;

        newBlobName =
            await _profilePictureService
                .UploadAsync(
                    userId,
                    request.File,
                    cancellationToken);

        user.ProfilePictureBlobName =
            newBlobName;

        await _context.SaveChangesAsync(
            cancellationToken);

        if (
            !string.IsNullOrWhiteSpace(
                oldBlobName) &&
            !string.Equals(
                oldBlobName,
                newBlobName,
                StringComparison.Ordinal))
        {
            try
            {
                await _profilePictureService
                    .DeleteAsync(
                        oldBlobName,
                        cancellationToken);
            }
            catch (Exception deleteException)
            {
                Console.WriteLine(
                    $"[PROFILE PICTURE] Unable to delete previous blob: {deleteException.Message}");
            }
        }

        return Ok(new
        {
            message =
                "Profile picture uploaded successfully.",

            profilePictureUrl =
                "/api/User/profile/picture"
        });
    }
    catch (ArgumentException ex)
    {
        if (
            !string.IsNullOrWhiteSpace(
                newBlobName))
        {
            try
            {
                await _profilePictureService
                    .DeleteAsync(
                        newBlobName,
                        cancellationToken);
            }
            catch
            {
            }
        }

        return BadRequest(new
        {
            message = ex.Message
        });
    }
    catch (Exception ex)
    {
        if (
            !string.IsNullOrWhiteSpace(
                newBlobName))
        {
            try
            {
                await _profilePictureService
                    .DeleteAsync(
                        newBlobName,
                        cancellationToken);
            }
            catch
            {
            }
        }

        Console.WriteLine(
            $"[PROFILE PICTURE] Upload error: {ex}");

        return StatusCode(
            StatusCodes.Status500InternalServerError,
            new
            {
                message =
                    "Unable to upload the profile picture."
            });
    }
}

        [HttpGet("profile/picture")]
        public async Task<IActionResult> GetProfilePicture(
            CancellationToken cancellationToken)
        {
            var userId =
                User.FindFirst(
                    ClaimTypes.NameIdentifier)
                    ?.Value;

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            try
            {
                var blobName =
                    await _context
                        .Set<User>()
                        .AsNoTracking()
                        .Where(
                            item =>
                                item.UserId == userId)
                        .Select(
                            item =>
                                item.ProfilePictureBlobName)
                        .FirstOrDefaultAsync(
                            cancellationToken);

                if (string.IsNullOrWhiteSpace(blobName))
                {
                    return NotFound(new
                    {
                        message =
                            "No profile picture has been uploaded."
                    });
                }

                var stream =
                    await _profilePictureService
                        .OpenReadAsync(
                            blobName,
                            cancellationToken);

                if (stream == null)
                {
                    return NotFound(new
                    {
                        message =
                            "The profile picture could not be found."
                    });
                }

                var contentType =
                    _profilePictureService
                        .GetContentType(blobName);

                return File(
                    stream,
                    contentType);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[PROFILE PICTURE] Read error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load the profile picture."
                    });
            }
        }

        [HttpDelete("profile/picture")]
        public async Task<IActionResult> DeleteProfilePicture(
            CancellationToken cancellationToken)
        {
            var userId =
                User.FindFirst(
                    ClaimTypes.NameIdentifier)
                    ?.Value;

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            try
            {
                var user =
                    await _context
                        .Set<User>()
                        .FirstOrDefaultAsync(
                            item =>
                                item.UserId == userId,
                            cancellationToken);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message =
                            "User account was not found."
                    });
                }

                var oldBlobName =
                    user.ProfilePictureBlobName;

                if (string.IsNullOrWhiteSpace(oldBlobName))
                {
                    return NoContent();
                }

                user.ProfilePictureBlobName =
                    null;

                await _context.SaveChangesAsync(
                    cancellationToken);

                try
                {
                    await _profilePictureService
                        .DeleteAsync(
                            oldBlobName,
                            cancellationToken);
                }
                catch (Exception deleteException)
                {
                    Console.WriteLine(
                        $"[PROFILE PICTURE] Unable to delete blob after database update: {deleteException.Message}");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[PROFILE PICTURE] Delete error: {ex}");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to remove the profile picture."
                    });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{userId}/activate")]
        public IActionResult ActivateUser(
            string userId)
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
        public IActionResult DeactivateUser(
            string userId)
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
        public IActionResult DeleteUser(
            string userId)
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
        public IActionResult EmailExists(
            string email)
        {
            return Ok(new
            {
                exists =
                    _userService.EmailExists(email)
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("exists/idnumber/{idNumber}")]
        public IActionResult IdNumberExists(
            string idNumber)
        {
            return Ok(new
            {
                exists =
                    _userService.IdNumberExists(
                        idNumber)
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("exists/cellno/{cellNo}")]
        public IActionResult CellNoExists(
            string cellNo)
        {
            return Ok(new
            {
                exists =
                    _userService.CellNoExists(
                        cellNo)
            });
        }
    }
}