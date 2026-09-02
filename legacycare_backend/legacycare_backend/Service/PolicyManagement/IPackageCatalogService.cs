
using Microsoft.AspNetCore.Http;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IPackageCatalogService
    {
        // =========================================================
        // CATEGORIES
        // =========================================================

        Task<IEnumerable<PackageItemCategory>> GetCategoriesAsync();

        Task<PackageItemCategory?> GetCategoryByIdAsync(
            string categoryId);

        Task<PackageItemCategory> CreateCategoryAsync(
            PackageItemCategory category);

        Task<PackageItemCategory> UpdateCategoryAsync(
            string categoryId,
            PackageItemCategory category);

        Task DeleteCategoryAsync(
            string categoryId);

        // =========================================================
        // ITEMS
        // =========================================================

        Task<IEnumerable<PackageItem>> GetItemsAsync(
            string? categoryId = null);

        Task<PackageItem?> GetItemByIdAsync(
            string packageItemId);

        Task<PackageItem> CreateItemAsync(
            PackageItem item);

        Task<PackageItem> UpdateItemAsync(
            string packageItemId,
            PackageItem item);

        Task DeleteItemAsync(
            string packageItemId);

        // =========================================================
        // PICTURES
        // =========================================================

        Task<string> UploadItemPictureAsync(
            string packageItemId,
            IFormFile file,
            CancellationToken cancellationToken = default);

        Task DeleteItemPictureAsync(
            string packageItemId,
            CancellationToken cancellationToken = default);

        Task<Stream?> OpenItemPictureAsync(
            string packageItemId,
            CancellationToken cancellationToken = default);

        string GetItemPictureContentType(
            string blobName);
    }
}
