using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class DeathNotification
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public string DeathNotificationId { get; set; }
            = Guid.NewGuid().ToString();

        // =========================================================
        // REQUEST NUMBER
        // =========================================================

        [Required]
        [MaxLength(20)]
        public string RequestNumber { get; set; }
            = string.Empty;

        // =========================================================
        // POLICY
        // =========================================================

        [Required]
        public string PolicyId { get; set; }
            = string.Empty;

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        // =========================================================
        // BENEFICIARY
        // =========================================================

        [Required]
        public string BeneficiaryId { get; set; }
            = string.Empty;

        [ForeignKey(nameof(BeneficiaryId))]
        public virtual Beneficiary? Beneficiary { get; set; }

        // =========================================================
        // REPORTED BY
        // =========================================================

        [Required]
        public string ReportedByUserId { get; set; }
            = string.Empty;

        [ForeignKey(nameof(ReportedByUserId))]
        public virtual User? ReportedByUser { get; set; }

        // =========================================================
        // VERIFIED BY
        // =========================================================

        public string? VerifiedByUserId { get; set; }

        [ForeignKey(nameof(VerifiedByUserId))]
        public virtual User? VerifiedBy { get; set; }

        // =========================================================
        // BRANCH
        // =========================================================

        public string? BranchId { get; set; }

        [ForeignKey(nameof(BranchId))]
        public virtual Branch? Branch { get; set; }

        // =========================================================
        // DEATH INFORMATION
        // =========================================================

        [Required]
        public DateTime DateOfDeath { get; set; }

        public DateTime DateReported { get; set; }
            = DateTime.Now;

        // =========================================================
        // PROOF OF DEATH
        // =========================================================

        [Required]
        public string ProofOfDeathDocument { get; set; }
            = string.Empty;

        public string? DocumentFileName { get; set; }

        // =========================================================
        // STATUS
        // =========================================================

        public DeathNotificationStatus Status { get; set; }
            = DeathNotificationStatus.Pending;

        // =========================================================
        // REJECTION
        // =========================================================

        public string? RejectionReason { get; set; }

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        public DeathNotification()
        {
            DeathNotificationId = Guid.NewGuid().ToString();

            RequestNumber = string.Empty;

            DateReported = DateTime.Now;

            Status = DeathNotificationStatus.Pending;
        }

        // =========================================================
        // APPROVE
        // =========================================================

        public void Approve(string verifiedByUserId)
        {
            if (Status != DeathNotificationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending death notifications can be approved."
                );
            }

            if (string.IsNullOrWhiteSpace(verifiedByUserId))
            {
                throw new ArgumentException(
                    "Verified user ID is required."
                );
            }

            Status = DeathNotificationStatus.Approved;

            VerifiedByUserId = verifiedByUserId;

            RejectionReason = null;
        }

        // =========================================================
        // REJECT
        // =========================================================

        public void Reject(
            string verifiedByUserId,
            string reason)
        {
            if (Status != DeathNotificationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending death notifications can be rejected."
                );
            }

            if (string.IsNullOrWhiteSpace(verifiedByUserId))
            {
                throw new ArgumentException(
                    "Verified user ID is required."
                );
            }

            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new ArgumentException(
                    "A rejection reason is required."
                );
            }

            Status = DeathNotificationStatus.Rejected;

            VerifiedByUserId = verifiedByUserId;

            RejectionReason = reason;
        }
    }
}