using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models
{
    public class ServiceRequest
    {
        // ============================================================
        // PRIMARY KEY
        // ============================================================

        [Key]
        public int ServiceRequestId { get; set; }

        // ============================================================
        // CLIENT
        // ============================================================

        [Required]
        public string ClientId { get; set; } = string.Empty;

        // ============================================================
        // REQUEST INFORMATION
        // ============================================================

        [Required]
        public string RequestType { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";

        public string Priority { get; set; } = "Normal";

        public string? Description { get; set; }

        // ============================================================
        // BRANCH
        // ============================================================

        public string? BranchId { get; set; }

        // ============================================================
        // STAFF
        // ============================================================

        public int? AssignedStaffId { get; set; }

        // ============================================================
        // DATES
        // ============================================================

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? UpdatedDate { get; set; }

        public DateTime? DueDate { get; set; }

        // ============================================================
        // APPOINTMENT / FUNERAL DATE AND TIME
        // ============================================================

        public DateTime? AppointmentDateTime { get; set; }

        // ============================================================
        // HIGH PRIORITY FEE
        // ============================================================

        public decimal? AdditionalFee { get; set; }

        // ============================================================
        // FUNERAL REQUEST
        // ============================================================

        public string? FuneralRequestId { get; set; }

        // ============================================================
        // NAVIGATION PROPERTIES
        // ============================================================

        [ForeignKey(nameof(ClientId))]
        public virtual Client? Client { get; set; }

        [ForeignKey(nameof(BranchId))]
        public virtual Branch? Branch { get; set; }

        [ForeignKey(nameof(FuneralRequestId))]
        public virtual FuneralRequest? FuneralRequest { get; set; }
    }
}