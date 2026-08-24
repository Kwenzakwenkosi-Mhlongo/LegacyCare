using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class ReviewFuneralRequestRequest
    {
        // Approve or Reject
        [Required]
        public string Action { get; set; } = string.Empty;

        // Required only when approving
        public int StaffRequired { get; set; } = 5;

        // Required only when rejecting
        public string? RejectionReason { get; set; }
    }
}