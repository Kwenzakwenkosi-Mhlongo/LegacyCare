// File:
// legacycare_backend/legacycare_backend/Service/UserManagement/IProfilePictureService.cs

using Microsoft.AspNetCore.Http;

namespace PolicyManagement.Service.UserManagement
{
    public interface IProfilePictureService
    {
        Task<string> UploadAsync(
            string userId,
            IFormFile file,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(
            string? blobName,
            CancellationToken cancellationToken = default);

        Task<Stream?> OpenReadAsync(
            string blobName,
            CancellationToken cancellationToken = default);

        string GetContentType(
            string blobName);
    }
}