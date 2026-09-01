// ============================================================================
// FILE 2:
// Service/DocumentManagement/IDocumentService.cs
// ============================================================================

using PolicyManagement.DTOs.Responses;

namespace PolicyManagement.Service.DocumentManagement
{
    public interface IDocumentService
    {
        Task<IReadOnlyList<UploadedDocumentDto>>
            GetClientUploadsAsync(
                string userId,
                CancellationToken cancellationToken = default);
    }
}