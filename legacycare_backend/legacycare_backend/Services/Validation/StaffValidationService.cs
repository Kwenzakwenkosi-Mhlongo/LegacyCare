using System.Text.RegularExpressions;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Service.UserManagement;

public class StaffValidationService : IStaffValidationService
{
    private readonly IUserService _userService;
    public StaffValidationService(IUserService userService)
    {
        _userService = userService;
    }

    public string? Validate(CreateStaffRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return "Full Name Is Required.";

        if (string.IsNullOrWhiteSpace(request.IDNumber))
            return "ID Number Is Required.";

        if (string.IsNullOrWhiteSpace(request.Email))
            return "Email Address Is Required.";

        if (string.IsNullOrWhiteSpace(request.CellNo))
            return "Cellphone Number Is Required.";

        if (string.IsNullOrWhiteSpace(request.Address))
            return "Address Is Required.";

        if (string.IsNullOrWhiteSpace(request.BranchId))
            return "Branch is required.";

        if (_userService.EmailExists(request.Email))
            return "Email address already exists";

        if (_userService.IdNumberExists(request.IDNumber))
            return "ID Number already exists";

        if (_userService.CellNoExists(request.CellNo))
            return "Cellphone Number already exists";

        if (!Regex.IsMatch(request.FullName, @"^[A-Za-z\s'-]+$"))
            return "Full Name contains invalid characters";

        if (!Regex.IsMatch(request.IDNumber, @"^\d{13}$"))
            return "ID Number must contain exactly 13 digits.";

        if (!Regex.IsMatch(request.CellNo, @"^0\d{9}$"))
            return "Cellphone Number must be exactly 10 digits and start with 0.";

        if (!Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return "Invalid Email Address format";

        return null;
    }

    public string? ValidateUpdate(UpdateStaffRequest request, string currentUserId)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return "Full Name Is Required.";

        if (string.IsNullOrWhiteSpace(request.IdNumber))
            return "ID Number Is Required.";

        if (string.IsNullOrWhiteSpace(request.Email))
            return "Email Address Is Required.";

        if (string.IsNullOrWhiteSpace(request.CellNo))
            return "Cellphone Number Is Required.";

        if (string.IsNullOrWhiteSpace(request.Address))
            return "Address Is Required.";

        if (string.IsNullOrWhiteSpace(request.BranchId))
            return "Branch is required.";

        if (!string.IsNullOrWhiteSpace(currentUserId))
        {
            var currentUser = _userService.GetUserById(currentUserId);

            if (currentUser != null)
            {
                if (currentUser.Email != request.Email && _userService.EmailExists(request.Email, currentUserId))
                    return "Email address already exists";

                if (currentUser.IDNumber != request.IdNumber && _userService.IdNumberExists(request.IdNumber, currentUserId))
                    return "ID Number already exists";

                if (currentUser.CellNo != request.CellNo && _userService.CellNoExists(request.CellNo, currentUserId))
                    return "Cellphone Number already exists";
            }
        }

        if (!Regex.IsMatch(request.FullName, @"^[A-Za-z\s'-]+$"))
            return "Full Name contains invalid characters";

        if (!Regex.IsMatch(request.IdNumber, @"^\d{13}$"))
            return "ID Number must contain exactly 13 digits.";

        if (!Regex.IsMatch(request.CellNo, @"^0\d{9}$"))
            return "Cellphone Number must be exactly 10 digits and start with 0.";

        if (!Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return "Invalid Email Address format";

        return null;
    }
}