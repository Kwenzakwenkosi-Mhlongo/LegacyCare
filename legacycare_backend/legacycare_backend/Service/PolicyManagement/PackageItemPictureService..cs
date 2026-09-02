using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;

namespace PolicyManagement.Service.PolicyManagement
{
    public class PackageItemPictureService
        : IPackageItemPictureService
    {
        private const long MaxFileSize =
            2 * 1024 * 1024;

        private static readonly HashSet<string> AllowedContentTypes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "image/jpeg",
                "image/png",
                "image/webp"
            };

        private readonly BlobContainerClient _containerClient;

        public PackageItemPictureService(
            IConfiguration configuration)
        {
            var connectionString =
                configuration["AzureStorage:ConnectionString"];

            var containerName =
                configuration["AzureStorage:PackageItemPicturesContainer"];

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    "AzureStorage:ConnectionString is not configured.");
            }

            if (string.IsNullOrWhiteSpace(containerName))
            {
                throw new InvalidOperationException(
                    "AzureStorage:PackageItemPicturesContainer is not configured.");
            }

            _containerClient =
                new BlobContainerClient(
                    connectionString,
                    containerName);
        }

        public async Task<string> UploadAsync(
            string packageItemId,
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(packageItemId))
            {
                throw new ArgumentException(
                    "Package item ID is required.",
                    nameof(packageItemId));
            }

            ValidateFile(file);

            var extension =
                GetExtension(file.ContentType);

            var blobName =
                $"{packageItemId}/item-{Guid.NewGuid():N}{extension}";

            var blobClient =
                _containerClient.GetBlobClient(
                    blobName);

            await using var stream =
                file.OpenReadStream();

            var options =
                new BlobUploadOptions
                {
                    HttpHeaders =
                        new BlobHttpHeaders
                        {
                            ContentType =
                                file.ContentType
                        }
                };

            await blobClient.UploadAsync(
                stream,
                options,
                cancellationToken);

            return blobName;
        }

        public async Task DeleteAsync(
            string? blobName,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(blobName))
            {
                return;
            }

            var blobClient =
                _containerClient.GetBlobClient(
                    blobName);

            await blobClient.DeleteIfExistsAsync(
                DeleteSnapshotsOption.IncludeSnapshots,
                cancellationToken:
                    cancellationToken);
        }

        public async Task<Stream?> OpenReadAsync(
            string blobName,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(blobName))
            {
                return null;
            }

            var blobClient =
                _containerClient.GetBlobClient(
                    blobName);

            var exists =
                await blobClient.ExistsAsync(
                    cancellationToken);

            if (!exists.Value)
            {
                return null;
            }

            var response =
                await blobClient.DownloadStreamingAsync(
                    cancellationToken:
                        cancellationToken);

            var memoryStream =
                new MemoryStream();

            await response.Value.Content.CopyToAsync(
                memoryStream,
                cancellationToken);

            memoryStream.Position = 0;

            return memoryStream;
        }

        public string GetContentType(
            string blobName)
        {
            var extension =
                Path.GetExtension(blobName)
                    .ToLowerInvariant();

            return extension switch
            {
                ".jpg" or ".jpeg" =>
                    "image/jpeg",

                ".png" =>
                    "image/png",

                ".webp" =>
                    "image/webp",

                _ =>
                    "application/octet-stream"
            };
        }

        private static void ValidateFile(
            IFormFile file)
        {
            if (file is null)
            {
                throw new ArgumentException(
                    "Package item picture is required.");
            }

            if (file.Length <= 0)
            {
                throw new ArgumentException(
                    "The selected image is empty.");
            }

            if (file.Length > MaxFileSize)
            {
                throw new ArgumentException(
                    "Package item pictures must be 2 MB or smaller.");
            }

            if (!AllowedContentTypes.Contains(
                    file.ContentType))
            {
                throw new ArgumentException(
                    "Only JPEG, PNG and WebP package item pictures are allowed.");
            }
        }

        private static string GetExtension(
            string contentType)
        {
            return contentType.ToLowerInvariant() switch
            {
                "image/jpeg" =>
                    ".jpg",

                "image/png" =>
                    ".png",

                "image/webp" =>
                    ".webp",

                _ =>
                    throw new ArgumentException(
                        "Unsupported image type.")
            };
        }
    }
}