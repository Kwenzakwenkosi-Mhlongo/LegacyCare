using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Client")]
    public class ClientPackageCatalogController :
        ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientPackageCatalogController(
            AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET ALL ACTIVE CATEGORIES WITH THEIR ACTIVE ITEMS
        //
        // GET:
        // api/ClientPackageCatalog/categories
        // ============================================================

        [HttpGet("categories")]
        public IActionResult GetCategories()
        {
            var categories =
                _context.PackageItemCategories
                    .AsNoTracking()
                    .Where(category =>
                        category.IsActive)
                    .OrderBy(category =>
                        category.DisplayOrder)
                    .ThenBy(category =>
                        category.Name)
                    .Select(category => new
                    {
                        categoryId =
                            category.CategoryId,

                        name =
                            category.Name,

                        description =
                            category.Description,

                        selectionMode =
                            category.SelectionMode,

                        minimumSelections =
                            category.MinimumSelections,

                        maximumSelections =
                            category.MaximumSelections,

                        minimumActiveChoices =
                            category.MinimumActiveChoices,

                        displayOrder =
                            category.DisplayOrder,

                        items =
                            category.Items
                                .Where(item =>
                                    item.IsActive)
                                .OrderBy(item =>
                                    item.DisplayOrder)
                                .ThenBy(item =>
                                    item.Name)
                                .Select(item => new
                                {
                                    packageItemId =
                                        item.PackageItemId,

                                    categoryId =
                                        item.CategoryId,

                                    name =
                                        item.Name,

                                    description =
                                        item.Description,

                                    serviceValue =
                                        item.ServiceValue,

                                    monthlyPremiumContribution =
                                        item.MonthlyPremiumContribution,

                                    imageBlobName =
                                        item.ImageBlobName,

                                    displayOrder =
                                        item.DisplayOrder
                                })
                                .ToList()
                    })
                    .ToList();

            return Ok(categories);
        }

        // ============================================================
        // GET ONE ACTIVE CATEGORY WITH ITS ACTIVE ITEMS
        //
        // GET:
        // api/ClientPackageCatalog/categories/{categoryId}
        // ============================================================

        [HttpGet("categories/{categoryId}")]
        public IActionResult GetCategory(
            string categoryId)
        {
            if (string.IsNullOrWhiteSpace(categoryId))
            {
                return BadRequest(
                    "Category ID is required.");
            }

            var category =
                _context.PackageItemCategories
                    .AsNoTracking()
                    .Where(item =>
                        item.CategoryId == categoryId &&
                        item.IsActive)
                    .Select(item => new
                    {
                        categoryId =
                            item.CategoryId,

                        name =
                            item.Name,

                        description =
                            item.Description,

                        selectionMode =
                            item.SelectionMode,

                        minimumSelections =
                            item.MinimumSelections,

                        maximumSelections =
                            item.MaximumSelections,

                        minimumActiveChoices =
                            item.MinimumActiveChoices,

                        displayOrder =
                            item.DisplayOrder,

                        items =
                            item.Items
                                .Where(packageItem =>
                                    packageItem.IsActive)
                                .OrderBy(packageItem =>
                                    packageItem.DisplayOrder)
                                .ThenBy(packageItem =>
                                    packageItem.Name)
                                .Select(packageItem => new
                                {
                                    packageItemId =
                                        packageItem.PackageItemId,

                                    categoryId =
                                        packageItem.CategoryId,

                                    name =
                                        packageItem.Name,

                                    description =
                                        packageItem.Description,

                                    serviceValue =
                                        packageItem.ServiceValue,

                                    monthlyPremiumContribution =
                                        packageItem.MonthlyPremiumContribution,

                                    imageBlobName =
                                        packageItem.ImageBlobName,

                                    displayOrder =
                                        packageItem.DisplayOrder
                                })
                                .ToList()
                    })
                    .FirstOrDefault();

            if (category == null)
            {
                return NotFound(
                    "Package item category not found.");
            }

            return Ok(category);
        }

        // ============================================================
        // GET ALL ACTIVE PACKAGE ITEMS
        //
        // GET:
        // api/ClientPackageCatalog/items
        // ============================================================

        [HttpGet("items")]
        public IActionResult GetItems()
        {
            var items =
                _context.PackageItems
                    .AsNoTracking()
                    .Where(item =>
                        item.IsActive &&
                        item.Category != null &&
                        item.Category.IsActive)
                    .OrderBy(item =>
                        item.Category!.DisplayOrder)
                    .ThenBy(item =>
                        item.DisplayOrder)
                    .ThenBy(item =>
                        item.Name)
                    .Select(item => new
                    {
                        packageItemId =
                            item.PackageItemId,

                        categoryId =
                            item.CategoryId,

                        categoryName =
                            item.Category!.Name,

                        name =
                            item.Name,

                        description =
                            item.Description,

                        serviceValue =
                            item.ServiceValue,

                        monthlyPremiumContribution =
                            item.MonthlyPremiumContribution,

                        imageBlobName =
                            item.ImageBlobName,

                        displayOrder =
                            item.DisplayOrder
                    })
                    .ToList();

            return Ok(items);
        }

        // ============================================================
        // GET ONE ACTIVE PACKAGE ITEM
        //
        // GET:
        // api/ClientPackageCatalog/items/{packageItemId}
        // ============================================================

        [HttpGet("items/{packageItemId}")]
        public IActionResult GetItem(
            string packageItemId)
        {
            if (string.IsNullOrWhiteSpace(packageItemId))
            {
                return BadRequest(
                    "Package item ID is required.");
            }

            var item =
                _context.PackageItems
                    .AsNoTracking()
                    .Where(packageItem =>
                        packageItem.PackageItemId ==
                            packageItemId &&
                        packageItem.IsActive &&
                        packageItem.Category != null &&
                        packageItem.Category.IsActive)
                    .Select(packageItem => new
                    {
                        packageItemId =
                            packageItem.PackageItemId,

                        categoryId =
                            packageItem.CategoryId,

                        categoryName =
                            packageItem.Category!.Name,

                        name =
                            packageItem.Name,

                        description =
                            packageItem.Description,

                        serviceValue =
                            packageItem.ServiceValue,

                        monthlyPremiumContribution =
                            packageItem.MonthlyPremiumContribution,

                        imageBlobName =
                            packageItem.ImageBlobName,

                        displayOrder =
                            packageItem.DisplayOrder
                    })
                    .FirstOrDefault();

            if (item == null)
            {
                return NotFound(
                    "Package item not found.");
            }

            return Ok(item);
        }
    }
}