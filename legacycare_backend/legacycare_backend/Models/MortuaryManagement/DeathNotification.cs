// ============================================================================
// FILE: Models/MortuaryManagement/DeathNotification.cs
// ============================================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class DeathNotification
    {
        [Key]
        public string DeathNotificationId { get; set; } =
            Guid.NewGuid().ToString();

        [Required]
        public string PolicyId { get; set; } = string.Empty;

        [Required]
        public string BeneficiaryId { get; set; } = string.Empty;

        [Required]
        public string ReportedByUserId { get; set; } = string.Empty;

        [Required]
        public string BranchId { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfDeath { get; set; }

        [Required]
        public DateTime DateReported { get; set; } =
            DateTime.UtcNow;

        public DeathNotificationStatus Status { get; private set; } =
            DeathNotificationStatus.Pending;

        public string? VerifiedByUserId { get; private set; }

        public DateTime? DateVerified { get; private set; }

        [MaxLength(1000)]
        public string? RejectionReason { get; private set; }

        [MaxLength(50)]
        public string? RequestNumber { get; set; }

        [MaxLength(100)]
        public string? RelationshipToDeceased { get; set; }

        [MaxLength(200)]
        public string? ContactPerson { get; set; }

        [MaxLength(50)]
        public string? ContactNumber { get; set; }

        [MaxLength(50)]
        public string? BodyLocationType { get; private set; }

        [MaxLength(500)]
        public string? BodyLocationAddress { get; private set; }

        [MaxLength(200)]
        public string? MortuaryName { get; private set; }

        [MaxLength(450)]
        public string? StorageId { get; private set; }

        [MaxLength(100)]
        public string? StorageUnitNumber { get; private set; }

        public DateTime? CollectionDate { get; private set; }

        [MaxLength(1000)]
        public string? CollectionNotes { get; private set; }

        public string? ProofOfDeathDocument { get; set; }

        public string? DocumentFileName { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        [ForeignKey(nameof(BeneficiaryId))]
        public virtual Beneficiary? Beneficiary { get; set; }

        [ForeignKey(nameof(ReportedByUserId))]
        public virtual User? ReportedByUser { get; set; }

        [ForeignKey(nameof(VerifiedByUserId))]
        public virtual User? VerifiedBy { get; set; }

        [ForeignKey(nameof(BranchId))]
        public virtual Branch? Branch { get; set; }

        [ForeignKey(nameof(StorageId))]
        public virtual Storage? Storage { get; private set; }

        public void SetBodyLocation(
            string bodyLocationType,
            string? bodyLocationAddress,
            string? mortuaryName,
            DateTime? collectionDate,
            string? collectionNotes)
        {
            if (Status != DeathNotificationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Body location can only be updated while the death notification is pending.");
            }

            var normalizedType =
                BodyLocationTypes.Normalize(bodyLocationType);

            switch (normalizedType)
            {
                case BodyLocationTypes.HomeScene:
                    if (string.IsNullOrWhiteSpace(bodyLocationAddress))
                    {
                        throw new ArgumentException(
                            "Body location address is required for HomeScene.");
                    }

                    MortuaryName = null;
                    ClearStorageReservation();
                    break;

                case BodyLocationTypes.Hospital:
                    if (string.IsNullOrWhiteSpace(bodyLocationAddress))
                    {
                        throw new ArgumentException(
                            "Hospital name or address is required.");
                    }

                    MortuaryName = null;
                    ClearStorageReservation();
                    break;

                case BodyLocationTypes.GovernmentMortuary:
                    if (string.IsNullOrWhiteSpace(mortuaryName))
                    {
                        throw new ArgumentException(
                            "Mortuary name is required for a government mortuary.");
                    }

                    if (string.IsNullOrWhiteSpace(bodyLocationAddress))
                    {
                        throw new ArgumentException(
                            "Mortuary address is required for a government mortuary.");
                    }

                    ClearStorageReservation();
                    break;

                case BodyLocationTypes.LegacyCareMortuary:
                    // Storage is assigned only through ReserveStorage().
                    break;

                case BodyLocationTypes.Other:
                    if (string.IsNullOrWhiteSpace(bodyLocationAddress))
                    {
                        throw new ArgumentException(
                            "Body location address is required for Other.");
                    }

                    MortuaryName = null;
                    ClearStorageReservation();
                    break;

                default:
                    throw new ArgumentException(
                        "Invalid body location type.");
            }

            BodyLocationType = normalizedType;

            BodyLocationAddress =
                string.IsNullOrWhiteSpace(bodyLocationAddress)
                    ? null
                    : bodyLocationAddress.Trim();

            MortuaryName =
                string.IsNullOrWhiteSpace(mortuaryName)
                    ? null
                    : mortuaryName.Trim();

            CollectionDate = collectionDate;

            CollectionNotes =
                string.IsNullOrWhiteSpace(collectionNotes)
                    ? null
                    : collectionNotes.Trim();
        }

        public void ReserveStorage(Storage storage)
        {
            ArgumentNullException.ThrowIfNull(storage);

            if (Status != DeathNotificationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Storage can only be assigned to a pending death notification.");
            }

            if (BodyLocationType !=
                BodyLocationTypes.LegacyCareMortuary)
            {
                throw new InvalidOperationException(
                    "Storage can only be assigned when the body location is LegacyCareMortuary.");
            }

            if (!string.Equals(
                    storage.BranchId,
                    BranchId,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "The selected storage unit does not belong to this notification's branch.");
            }

            StorageId = storage.StorageId;
            StorageUnitNumber = storage.UnitNumber;
            Storage = storage;
        }

        public void ClearStorageReservation()
        {
            StorageId = null;
            StorageUnitNumber = null;
            Storage = null;
        }

        public void Approve(
            string verifiedByUserId)
        {
            if (Status != DeathNotificationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending death notifications can be approved.");
            }

            if (string.IsNullOrWhiteSpace(verifiedByUserId))
            {
                throw new ArgumentException(
                    "Verified-by user ID is required.",
                    nameof(verifiedByUserId));
            }

            Status = DeathNotificationStatus.Approved;
            VerifiedByUserId = verifiedByUserId;
            DateVerified = DateTime.UtcNow;
            RejectionReason = null;
        }

        public void Reject(
            string verifiedByUserId,
            string reason)
        {
            if (Status != DeathNotificationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending death notifications can be rejected.");
            }

            if (string.IsNullOrWhiteSpace(verifiedByUserId))
            {
                throw new ArgumentException(
                    "Verified-by user ID is required.",
                    nameof(verifiedByUserId));
            }

            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new ArgumentException(
                    "A rejection reason is required.",
                    nameof(reason));
            }

            Status = DeathNotificationStatus.Rejected;
            VerifiedByUserId = verifiedByUserId;
            DateVerified = DateTime.UtcNow;
            RejectionReason = reason.Trim();
        }
    }
}