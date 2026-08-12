using PolicyManagement.DTOs.Requests;

public interface IStaffValidationService
{
    string? Validate(CreateStaffRequest request);

        public string? ValidateUpdate(UpdateStaffRequest request, string currentUserId);

}