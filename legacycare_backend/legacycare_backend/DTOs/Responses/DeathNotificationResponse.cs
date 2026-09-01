using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Responses
{
    public class DeathNotificationResponse
    {
        // =========================================================
        // IDENTIFICATION
        // =========================================================

        public string DeathNotificationId { get; set; } = string.Empty;

        public string RequestNumber { get; set; } = string.Empty;

        public string PolicyId { get; set; } = string.Empty;

        public string BeneficiaryId { get; set; } = string.Empty;

        // =========================================================
        // DEATH INFORMATION
        // =========================================================

        public DateTime DateOfDeath { get; set; }

        public DateTime DateReported { get; set; }

        // =========================================================
        // DEATH NOTIFICATION CONTACT
        // =========================================================

        public string? RelationshipToDeceased { get; set; }

        public string? ContactPerson { get; set; }

        public string? ContactNumber { get; set; }

        // =========================================================
        // BODY LOCATION
        // =========================================================

        public string? BodyLocationType { get; set; }

        public string? BodyLocationAddress { get; set; }

        // =========================================================
        // MORTUARY
        // =========================================================

        public string? MortuaryName { get; set; }

        // =========================================================
        // STORAGE
        // =========================================================

        public string? StorageUnitNumber { get; set; }

        // =========================================================
        // COLLECTION
        // =========================================================

        public DateTime? CollectionDate { get; set; }

        public string? CollectionNotes { get; set; }

        // =========================================================
        // BENEFICIARY DETAILS
        // =========================================================

        public string? BeneficiaryName { get; set; }

        public string? BeneficiaryIDNumber { get; set; }

        public DateTime? BeneficiaryDateOfBirth { get; set; }

        public string? BeneficiaryGender { get; set; }

        public string? BeneficiaryRelationship { get; set; }

        public string? BeneficiaryStatus { get; set; }

        // =========================================================
        // DOCUMENT
        // =========================================================

        public string ProofOfDeathDocument { get; set; } = string.Empty;

        public string? DocumentFileName { get; set; }

        public string? DocumentUrl { get; set; }

        // =========================================================
        // STATUS
        // =========================================================

        public DeathNotificationStatus Status { get; set; }

        public string? RejectionReason { get; set; }

        // =========================================================
        // BRANCH
        // =========================================================

        public string? BranchId { get; set; }

        public string? BranchName { get; set; }

        public string? BranchAddress { get; set; }

        // =========================================================
        // USERS
        // =========================================================

        public string? ReportedByUserId { get; set; }

        public string? VerifiedByUserId { get; set; }
    }
}