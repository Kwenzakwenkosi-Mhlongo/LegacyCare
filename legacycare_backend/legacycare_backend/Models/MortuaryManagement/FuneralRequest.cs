// Models/MortuaryManagement/FuneralRequest.cs

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class FuneralRequest
    {
        [Key]
        public string FuneralRequestId { get; set; }
            = Guid.NewGuid().ToString();

        // ============================================================
        // DEATH NOTIFICATION
        // ============================================================

        [Required]
        public string DeathNotificationId { get; set; }
            = string.Empty;

        [ForeignKey(nameof(DeathNotificationId))]
        public virtual DeathNotification? DeathNotification { get; set; }

        // ============================================================
        // CLIENT
        // ============================================================

        [Required]
        public string ClientId { get; set; }
            = string.Empty;

        [ForeignKey(nameof(ClientId))]
        public virtual Client? Client { get; set; }

        // ============================================================
        // BRANCH
        // ============================================================

        public string? BranchId { get; set; }

        [ForeignKey(nameof(BranchId))]
        public virtual Branch? Branch { get; set; }

        // ============================================================
        // FUNERAL DATE / TIME
        // ============================================================

        [Required]
        public DateTime FuneralDate { get; set; }

        [Required]
        public TimeSpan FuneralTime { get; set; }

        // ============================================================
        // VENUE
        // ============================================================

        [Required]
        [MaxLength(500)]
        public string Venue { get; set; } = string.Empty;

        // ============================================================
        // FUNERAL TYPE
        // ============================================================

        [Required]
        [MaxLength(100)]
        public string FuneralType { get; set; }
            = "Standard";

        // ============================================================
        // NOTES
        // ============================================================

        public string? Notes { get; set; }

        // ============================================================
        // STATUS
        // ============================================================

        [Required]
        [MaxLength(50)]
        public string Status { get; set; }
            = "Pending";

        // ============================================================
        // REJECTION
        // ============================================================

        public string? RejectionReason { get; set; }

        // ============================================================
        // STAFF REQUIRED
        //
        // LegacyCare requires exactly 4 operational staff members
        // per funeral. The client does not control this value.
        // The clerk selects the actual staff members from the
        // funeral's assigned branch.
        // ============================================================

        [Required]
        public int StaffRequired { get; set; } = 4;

        // ============================================================
        // APPROVAL
        // ============================================================

        public string? ApprovedByClerkId { get; set; }

        public DateTime? ApprovedDate { get; set; }

        // ============================================================
        // AUDIT
        // ============================================================

        public DateTime CreatedDate { get; set; }
            = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; }
            = DateTime.UtcNow;

        // ============================================================
        // STAFF DEPLOYMENTS
        // ============================================================

        public virtual ICollection<FuneralStaffDeployment>
            StaffDeployments { get; set; }
            = new List<FuneralStaffDeployment>();
    }
}