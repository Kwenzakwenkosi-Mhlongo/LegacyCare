// ============================================================================
// FILE 1:
// DTOs/Responses/UploadedDocumentDto.cs
// ============================================================================

namespace PolicyManagement.DTOs.Responses
{
    public class UploadedDocumentDto
    {
        public string DocumentId { get; set; } = string.Empty;

        public string DocumentType { get; set; } = string.Empty;

        public string FileName { get; set; } = string.Empty;

        public string SourceType { get; set; } = string.Empty;

        public string SourceId { get; set; } = string.Empty;

        public string? ReferenceNumber { get; set; }

        public string? PolicyId { get; set; }

        public string? RelatedPersonName { get; set; }

        public DateTime UploadedDate { get; set; }

        public string DownloadUrl { get; set; } = string.Empty;
    }
}
