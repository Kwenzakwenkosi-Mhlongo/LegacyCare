using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.UserManagement;
using PolicyManagement.Utilities;

namespace PolicyManagement.Controllers.UserManagement
{
    [Authorize(Roles = "Admin,Clerk")]
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly IStaffService _staffService;
        private readonly IUserService _userService;
        private readonly IPasswordService _passwordService;
        private readonly IStaffValidationService _staffValidationService;

        public StaffController(
            IStaffService staffService,
            IUserService userService,
            IPasswordService passwordService,
            IStaffValidationService staffValidationService)
        {
            _staffService = staffService;
            _userService = userService;
            _passwordService = passwordService;
            _staffValidationService = staffValidationService;
        }

        [HttpGet]
        public IActionResult GetAllStaff()
        {
            return Ok(_staffService.GetAllStaff());
        }

        [HttpGet("{staffId}")]
        public IActionResult GetStaffById(string staffId)
        {
            return Ok(_staffService.GetStaffById(staffId));
        }

        [HttpGet("type/{type}")]
        public IActionResult GetStaffByType(string type)
        {
            return Ok(_staffService.GetStaffByRole(type));
        }

        [HttpGet("lookup")]
        public IActionResult GetStaffLookup()
        {
            var allStaff = _staffService.GetAllStaff();

            var lookupData = allStaff
                .Where(s => s.User != null && s.User.IsActive)
                .Select(s => new
                {
                    staffId = s.StaffId,
                    userId = s.UserId,
                    displayStaffId = s.DisplayStaffId,
                    fullName = s.User.FullName,
                    roleName = s.StaffRole.ToString()
                })
                .OrderBy(s => s.fullName)
                .ToList();

            return Ok(lookupData);
        }

        [HttpPost]
        public IActionResult CreateStaff(CreateStaffRequest request)
        {
            var validationError = _staffValidationService.Validate(request);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }
            string generatedPassword = PasswordGenerator.Generate();

            var user = new User
            {
                FullName = request.FullName,
                IDNumber = request.IDNumber,
                Email = request.Email,
                PasswordHash = string.Empty,
                CellNo = request.CellNo,
                Address = request.Address,
                Role = Enums.UserRole.Staff,
            };

            user.PasswordHash = _passwordService.HashPassword(user, generatedPassword);
            var createdUser = _userService.CreateUser(user);

            var staff = new Staff
            {
                StaffRole = request.StaffRole,
                HireDate = request.HireDate,
                IsCovered = request.IsCovered,
                BranchId = request.BranchId,
                UserId = createdUser.UserId
            };

            var createdStaff = _staffService.CreateStaff(staff);

            return Ok(new { Staff = createdStaff, TemporaryPassword = generatedPassword });
        }

        [HttpPut("{staffId}")]
        public IActionResult UpdateStaff(string staffId, UpdateStaffRequest request)
        {
            var staff = _staffService.GetStaffById(staffId);
            var validationError = _staffValidationService.ValidateUpdate(request, staff.UserId);

            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            _staffService.UpdateStaff(staffId, request);
            return Ok();
        }

        [HttpDelete("{staffId}")]
        public IActionResult DeleteStaff(string staffId)
        {
            _staffService.DeleteStaff(staffId);
            return NoContent();
        }

        [HttpPut("{staffId}/activate")]
        public IActionResult ActivateStaff(string staffId)
        {
            _staffService.ActivateStaff(staffId);
            return NoContent();
        }
    }
}