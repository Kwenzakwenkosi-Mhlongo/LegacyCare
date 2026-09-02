using Microsoft.AspNetCore.Http;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IPackageItemPictureService
    {
        Task<string> UploadAsync(
            string packageItemId,
            IFormFile file,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(
            string? blobName,
            CancellationToken cancellationToken = default);

        Task<Stream?> OpenReadAsync(
            string blobName,
            CancellationToken cancellationToken = default);

        string GetContentType(string blobName);
    }
}