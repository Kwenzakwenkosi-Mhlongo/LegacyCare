
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Models;
using PolicyManagement.Service.PolicyManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/package-catalog")]
    [Authorize]
    public class PackageCatalogController : ControllerBase
    {
        private readonly IPackageCatalogService _catalogService;

        public PackageCatalogController(
            IPackageCatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        // =========================================================
        // CATEGORIES
        // =========================================================

        [HttpGet("categories")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public async Task<IActionResult> GetCategories()
        {
            return Ok(
                await _catalogService.GetCategoriesAsync());
        }

        [HttpGet("categories/{categoryId}")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public async Task<IActionResult> GetCategory(
            string categoryId)
        {
            var category =
                await _catalogService.GetCategoryByIdAsync(
                    categoryId);

            if (category == null)
            {
                return NotFound(
                    "Package item category not found.");
            }

            return Ok(category);
        }

        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(
            [FromBody] PackageItemCategory category)
        {
            try
            {
                var created =
                    await _catalogService.CreateCategoryAsync(
                        category);

                return CreatedAtAction(
                    nameof(GetCategory),
                    new
                    {
                        categoryId =
                            created.CategoryId
                    },
                    created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("categories/{categoryId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(
            string categoryId,
            [FromBody] PackageItemCategory category)
        {
            try
            {
                var updated =
                    await _catalogService.UpdateCategoryAsync(
                        categoryId,
                        category);

                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("categories/{categoryId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(
            string categoryId)
        {
            try
            {
                await _catalogService.DeleteCategoryAsync(
                    categoryId);

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // =========================================================
        // ITEMS
        // =========================================================

        [HttpGet("items")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public async Task<IActionResult> GetItems(
            [FromQuery] string? categoryId = null)
        {
            return Ok(
                await _catalogService.GetItemsAsync(
                    categoryId));
        }

        [HttpGet("items/{packageItemId}")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public async Task<IActionResult> GetItem(
            string packageItemId)
        {
            var item =
                await _catalogService.GetItemByIdAsync(
                    packageItemId);

            if (item == null)
            {
                return NotFound(
                    "Package item not found.");
            }

            return Ok(item);
        }

        [HttpPost("items")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateItem(
            [FromBody] PackageItem item)
        {
            try
            {
                var created =
                    await _catalogService.CreateItemAsync(
                        item);

                return CreatedAtAction(
                    nameof(GetItem),
                    new
                    {
                        packageItemId =
                            created.PackageItemId
                    },
                    created);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("items/{packageItemId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateItem(
            string packageItemId,
            [FromBody] PackageItem item)
        {
            try
            {
                var updated =
                    await _catalogService.UpdateItemAsync(
                        packageItemId,
                        item);

                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("items/{packageItemId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteItem(
            string packageItemId)
        {
            try
            {
                await _catalogService.DeleteItemAsync(
                    packageItemId);

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // =========================================================
        // ITEM PICTURES
        // =========================================================

        [HttpGet("items/{packageItemId}/picture")]
        [Authorize(Roles = "Admin,Staff,Clerk,Client")]
        public async Task<IActionResult> GetPicture(
            string packageItemId,
            CancellationToken cancellationToken)
        {
            try
            {
                var item =
                    await _catalogService.GetItemByIdAsync(
                        packageItemId);

                if (item == null)
                {
                    return NotFound(
                        "Package item not found.");
                }

                if (string.IsNullOrWhiteSpace(
                        item.ImageBlobName))
                {
                    return NotFound(
                        "Package item does not have a picture.");
                }

                var stream =
                    await _catalogService
                        .OpenItemPictureAsync(
                            packageItemId,
                            cancellationToken);

                if (stream == null)
                {
                    return NotFound(
                        "Package item picture not found.");
                }

                var contentType =
                    _catalogService
                        .GetItemPictureContentType(
                            item.ImageBlobName);

                return File(
                    stream,
                    contentType);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("items/{packageItemId}/picture")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadPicture(
            string packageItemId,
            IFormFile file,
            CancellationToken cancellationToken)
        {
            try
            {
                var blobName =
                    await _catalogService
                        .UploadItemPictureAsync(
                            packageItemId,
                            file,
                            cancellationToken);

                return Ok(
                    new
                    {
                        packageItemId,
                        imageBlobName = blobName
                    });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("items/{packageItemId}/picture")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePicture(
            string packageItemId,
            CancellationToken cancellationToken)
        {
            try
            {
                await _catalogService
                    .DeleteItemPictureAsync(
                        packageItemId,
                        cancellationToken);

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
