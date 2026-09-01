// File: Models/ScheduleManagement/Appointment.cs

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.ScheduleManagement
{
    public class Appointment
    {
        [Key]
        public int AppointmentId { get; set; }

        [Required]
        public int ServiceRequestId { get; set; }

        [Required]
        public string ClientId { get; set; } = string.Empty;

        [Required]
        public string BranchId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string AppointmentType { get; set; } = string.Empty;

        [Required]
        public DateTime PreferredDateTime { get; set; }

        public DateTime? ConfirmedDateTime { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Requested";

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "Normal";

        [MaxLength(2000)]
        public string? ClientNotes { get; set; }

        [MaxLength(2000)]
        public string? ClerkNotes { get; set; }

        public string? AssignedStaffId { get; set; }

        [MaxLength(1000)]
        public string? RescheduleReason { get; set; }

        [MaxLength(1000)]
        public string? CancellationReason { get; set; }

        public DateTime CreatedDate { get; set; } =
            DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } =
            DateTime.UtcNow;

        public DateTime? ConfirmedDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public DateTime? CancelledDate { get; set; }

        [ForeignKey(nameof(ServiceRequestId))]
        public virtual ServiceRequest? ServiceRequest { get; set; }

        [ForeignKey(nameof(ClientId))]
        public virtual Client? Client { get; set; }

        [ForeignKey(nameof(BranchId))]
        public virtual Branch? Branch { get; set; }

        [ForeignKey(nameof(AssignedStaffId))]
        public virtual Staff? AssignedStaff { get; set; }
    }
}