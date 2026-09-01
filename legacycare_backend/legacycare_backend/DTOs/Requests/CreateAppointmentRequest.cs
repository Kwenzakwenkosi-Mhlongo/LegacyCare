// File: DTOs/Requests/CreateAppointmentRequest.cs

using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class CreateAppointmentRequest
    {
        [Required]
        [MaxLength(100)]
        public string AppointmentType { get; set; } = string.Empty;

        [Required]
        public string BranchId { get; set; } = string.Empty;

        [Required]
        public DateTime PreferredDateTime { get; set; }

        [MaxLength(2000)]
        public string? ClientNotes { get; set; }

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "Normal";

        public bool AcceptPriorityFee { get; set; }
    }
}