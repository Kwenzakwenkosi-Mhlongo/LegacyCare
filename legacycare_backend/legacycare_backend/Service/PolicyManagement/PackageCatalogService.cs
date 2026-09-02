
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class PackageCatalogService : IPackageCatalogService
    {
        private readonly AppDbContext _context;
        private readonly IPackageItemPictureService _pictureService;

        public PackageCatalogService(
            AppDbContext context,
            IPackageItemPictureService pictureService)
        {
            _context = context;
            _pictureService = pictureService;
        }

        // =========================================================
        // CATEGORIES
        // =========================================================

        public async Task<IEnumerable<PackageItemCategory>>
            GetCategoriesAsync()
        {
            return await _context.PackageItemCategories
                .Include(c => c.Items)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<PackageItemCategory?>
            GetCategoryByIdAsync(string categoryId)
        {
            return await _context.PackageItemCategories
                .Include(c => c.Items)
                .FirstOrDefaultAsync(
                    c => c.CategoryId == categoryId);
        }

        public async Task<PackageItemCategory>
            CreateCategoryAsync(
                PackageItemCategory category)
        {
            if (category == null)
            {
                throw new ArgumentNullException(nameof(category));
            }

            if (string.IsNullOrWhiteSpace(category.Name))
            {
                throw new ArgumentException(
                    "Category name is required.");
            }

            category.CategoryId =
                Guid.NewGuid().ToString();

            category.DateCreated =
                DateTime.UtcNow;

            category.IsActive = true;

            _context.PackageItemCategories.Add(category);

            await _context.SaveChangesAsync();

            return category;
        }

        public async Task<PackageItemCategory>
            UpdateCategoryAsync(
                string categoryId,
                PackageItemCategory category)
        {
            var existing =
                await _context.PackageItemCategories
                    .FirstOrDefaultAsync(
                        c => c.CategoryId == categoryId);

            if (existing == null)
            {
                throw new KeyNotFoundException(
                    "Package item category not found.");
            }

            if (string.IsNullOrWhiteSpace(category.Name))
            {
                throw new ArgumentException(
                    "Category name is required.");
            }

            existing.UpdateDetails(
                category.Name,
                category.Description,
                category.SelectionMode,
                category.MinimumSelections,
                category.MaximumSelections,
                category.DisplayOrder);

            existing.IsActive =
                category.IsActive;

            await _context.SaveChangesAsync();

            return existing;
        }

        public async Task DeleteCategoryAsync(
            string categoryId)
        {
            var category =
                await _context.PackageItemCategories
                    .Include(c => c.Items)
                    .FirstOrDefaultAsync(
                        c => c.CategoryId == categoryId);

            if (category == null)
            {
                throw new KeyNotFoundException(
                    "Package item category not found.");
            }

            if (category.Items.Any())
            {
                throw new InvalidOperationException(
                    "Cannot delete a category that contains package items.");
            }

            _context.PackageItemCategories.Remove(category);

            await _context.SaveChangesAsync();
        }

        // =========================================================
        // ITEMS
        // =========================================================

        public async Task<IEnumerable<PackageItem>>
            GetItemsAsync(string? categoryId = null)
        {
            var query =
                _context.PackageItems
                    .Include(i => i.Category)
                    .AsQueryable();

            if (!string.IsNullOrWhiteSpace(categoryId))
            {
                query = query.Where(
                    i => i.CategoryId == categoryId);
            }

            return await query
                .OrderBy(i => i.DisplayOrder)
                .ThenBy(i => i.Name)
                .ToListAsync();
        }

        public async Task<PackageItem?>
            GetItemByIdAsync(string packageItemId)
        {
            return await _context.PackageItems
                .Include(i => i.Category)
                .FirstOrDefaultAsync(
                    i => i.PackageItemId == packageItemId);
        }

        public async Task<PackageItem>
            CreateItemAsync(PackageItem item)
        {
            if (item == null)
            {
                throw new ArgumentNullException(nameof(item));
            }

            var categoryExists =
                await _context.PackageItemCategories
                    .AnyAsync(
                        c => c.CategoryId == item.CategoryId);

            if (!categoryExists)
            {
                throw new KeyNotFoundException(
                    "Package item category not found.");
            }

            if (string.IsNullOrWhiteSpace(item.Name))
            {
                throw new ArgumentException(
                    "Package item name is required.");
            }

            if (item.ServiceValue <= 0)
            {
                throw new ArgumentException(
                    "Service value must be greater than zero.");
            }

            if (item.MonthlyPremiumContribution <= 0)
            {
                throw new ArgumentException(
                    "Monthly premium contribution must be greater than zero.");
            }

            item.PackageItemId =
                Guid.NewGuid().ToString();

            item.DateCreated =
                DateTime.UtcNow;

            item.IsActive = true;

            _context.PackageItems.Add(item);

            await _context.SaveChangesAsync();

            return item;
        }

        public async Task<PackageItem>
            UpdateItemAsync(
                string packageItemId,
                PackageItem item)
        {
            var existing =
                await _context.PackageItems
                    .FirstOrDefaultAsync(
                        i => i.PackageItemId == packageItemId);

            if (existing == null)
            {
                throw new KeyNotFoundException(
                    "Package item not found.");
            }

            var categoryExists =
                await _context.PackageItemCategories
                    .AnyAsync(
                        c => c.CategoryId == item.CategoryId);

            if (!categoryExists)
            {
                throw new KeyNotFoundException(
                    "Package item category not found.");
            }

            existing.CategoryId =
                item.CategoryId;

            existing.UpdateDetails(
                item.Name,
                item.Description,
                item.ServiceValue,
                item.MonthlyPremiumContribution,
                item.DisplayOrder);

            existing.IsActive =
                item.IsActive;

            await _context.SaveChangesAsync();

            return existing;
        }

        public async Task DeleteItemAsync(
            string packageItemId)
        {
            var item =
                await _context.PackageItems
                    .FirstOrDefaultAsync(
                        i => i.PackageItemId == packageItemId);

            if (item == null)
            {
                throw new KeyNotFoundException(
                    "Package item not found.");
            }

            if (!string.IsNullOrWhiteSpace(
                    item.ImageBlobName))
            {
                await _pictureService.DeleteAsync(
                    item.ImageBlobName);
            }

            _context.PackageItems.Remove(item);

            await _context.SaveChangesAsync();
        }

        // =========================================================
        // PICTURES
        // =========================================================

        public async Task<string>
            UploadItemPictureAsync(
                string packageItemId,
                IFormFile file,
                CancellationToken cancellationToken = default)
        {
            var item =
                await _context.PackageItems
                    .FirstOrDefaultAsync(
                        i => i.PackageItemId == packageItemId);

            if (item == null)
            {
                throw new KeyNotFoundException(
                    "Package item not found.");
            }

            var oldBlobName =
                item.ImageBlobName;

            var newBlobName =
                await _pictureService.UploadAsync(
                    packageItemId,
                    file,
                    cancellationToken);

            item.SetImage(newBlobName);

            await _context.SaveChangesAsync(
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(
                    oldBlobName))
            {
                await _pictureService.DeleteAsync(
                    oldBlobName,
                    cancellationToken);
            }

            return newBlobName;
        }

        public async Task DeleteItemPictureAsync(
            string packageItemId,
            CancellationToken cancellationToken = default)
        {
            var item =
                await _context.PackageItems
                    .FirstOrDefaultAsync(
                        i => i.PackageItemId == packageItemId);

            if (item == null)
            {
                throw new KeyNotFoundException(
                    "Package item not found.");
            }

            var blobName =
                item.ImageBlobName;

            item.SetImage(null);

            await _context.SaveChangesAsync(
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(blobName))
            {
                await _pictureService.DeleteAsync(
                    blobName,
                    cancellationToken);
            }
        }

        public async Task<Stream?>
            OpenItemPictureAsync(
                string packageItemId,
                CancellationToken cancellationToken = default)
        {
            var item =
                await _context.PackageItems
                    .FirstOrDefaultAsync(
                        i => i.PackageItemId == packageItemId);

            if (item == null)
            {
                throw new KeyNotFoundException(
                    "Package item not found.");
            }

            if (string.IsNullOrWhiteSpace(
                    item.ImageBlobName))
            {
                return null;
            }

            return await _pictureService.OpenReadAsync(
                item.ImageBlobName,
                cancellationToken);
        }

        public string GetItemPictureContentType(
            string blobName)
        {
            return _pictureService.GetContentType(
                blobName);
        }
    }
}
