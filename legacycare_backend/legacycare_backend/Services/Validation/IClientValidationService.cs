using PolicyManagement.DTOs.Requests;

public interface IClientValidationService
{
    string? Validate(CreateClientRequest request);

        public string? ValidateUpdate(UpdateClientRequest request, string currentUserId);

}