using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Responses
{
    public class DeathNotificationResponse
    {
        public string DeathNotificationId { get; set; } = string.Empty;

        public string PolicyId { get; set; } = string.Empty;

        public string BeneficiaryId { get; set; } = string.Empty;

        public string? BeneficiaryName { get; set; }

        public string? BeneficiaryIDNumber { get; set; }

        public DateTime DateOfDeath { get; set; }

        public DateTime DateReported { get; set; }

        public string ProofOfDeathDocument { get; set; } = string.Empty;

        public string? DocumentFileName { get; set; }
        public DateTime? BeneficiaryDateOfBirth { get; set; }

        public string? BeneficiaryGender { get; set; }

        public DeathNotificationStatus Status { get; set; }

        public string? RejectionReason { get; set; }

        public string? ReportedByUserId { get; set; }

        public string? VerifiedByUserId { get; set; }
    }
}