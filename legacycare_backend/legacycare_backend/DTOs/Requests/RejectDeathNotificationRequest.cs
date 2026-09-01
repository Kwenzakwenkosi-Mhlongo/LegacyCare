// ============================================================================
// FILE: DTOs/Requests/RejectDeathNotificationRequest.cs
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class RejectDeathNotificationRequest
    {
        [Required]
        [MaxLength(1000)]
        public string Reason { get; set; } = string.Empty;
    }
}
