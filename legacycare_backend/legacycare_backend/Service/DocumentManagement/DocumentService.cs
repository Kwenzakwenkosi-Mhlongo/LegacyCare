// ============================================================================
// FILE 3:
// Service/DocumentManagement/DocumentService.cs
// ============================================================================

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Responses;

namespace PolicyManagement.Service.DocumentManagement
{
    public class DocumentService : IDocumentService
    {
        private readonly AppDbContext _context;

        public DocumentService(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<UploadedDocumentDto>>
            GetClientUploadsAsync(
                string userId,
                CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }

            var deathDocuments =
                await _context.DeathNotifications
                    .AsNoTracking()
                    .Where(notification =>
                        notification.ReportedByUserId == userId &&
                        notification.DocumentFileName != null &&
                        notification.DocumentFileName != "")
                    .Select(notification =>
                        new UploadedDocumentDto
                        {
                            DocumentId =
                                $"death-{notification.DeathNotificationId}",

                            DocumentType =
                                "Proof of Death",

                            FileName =
                                notification.DocumentFileName!,

                            SourceType =
                                "DeathNotification",

                            SourceId =
                                notification.DeathNotificationId,

                            ReferenceNumber =
                                notification.RequestNumber,

                            PolicyId =
                                notification.PolicyId,

                            RelatedPersonName =
                                notification.Beneficiary != null
                                    ? notification.Beneficiary.FullName
                                    : null,

                            UploadedDate =
                                notification.DateReported,

                            DownloadUrl =
                                $"/api/DeathNotification/{notification.DeathNotificationId}/document"
                        })
                    .OrderByDescending(
                        document =>
                            document.UploadedDate)
                    .ToListAsync(
                        cancellationToken);

            return deathDocuments;
        }
    }
}
