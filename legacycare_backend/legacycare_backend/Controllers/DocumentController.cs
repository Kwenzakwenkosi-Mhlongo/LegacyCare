// ============================================================================
// FILE 4:
// Controllers/DocumentController.cs
// ============================================================================

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PolicyManagement.Service.DocumentManagement;

namespace PolicyManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentController(
            IDocumentService documentService)
        {
            _documentService =
                documentService;
        }

        [HttpGet("client/uploads")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult>
            GetClientUploads(
                CancellationToken cancellationToken)
        {
            try
            {
                var userId =
                    GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(
                        new
                        {
                            message =
                                "Unable to determine the logged-in user."
                        });
                }

                var documents =
                    await _documentService
                        .GetClientUploadsAsync(
                            userId,
                            cancellationToken);

                return Ok(documents);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(
                    new
                    {
                        message =
                            ex.Message
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load uploaded documents.",

                        detail =
                            ex.Message
                    });
            }
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirstValue(
                       ClaimTypes.NameIdentifier)
                   ??
                   User.FindFirstValue(
                       "userId")
                   ??
                   User.FindFirstValue(
                       "sub");
        }
    }
}
