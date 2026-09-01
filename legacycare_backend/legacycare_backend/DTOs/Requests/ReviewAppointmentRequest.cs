// File: DTOs/Requests/ReviewAppointmentRequest.cs

using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class ReviewAppointmentRequest
    {
        [Required]
        [MaxLength(30)]
        public string Action { get; set; } = string.Empty;

        public DateTime? ConfirmedDateTime { get; set; }

        public string? AssignedStaffId { get; set; }

        [MaxLength(2000)]
        public string? ClerkNotes { get; set; }

        [MaxLength(1000)]
        public string? Reason { get; set; }
    }
}