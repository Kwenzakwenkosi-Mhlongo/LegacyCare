using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using PolicyManagement.Models;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class Deceased
    {
        // =========================================================
        // PRIMARY KEY
        // =========================================================

        [Key]
        public required string DeceasedId { get; set; }

        // =========================================================
        // PERSONAL INFORMATION
        // =========================================================

        [Required]
        public required string FullName { get; set; }

        [Required]
        public required string IDNumber { get; set; }

        [Required]
        public required DateTime DateOfBirth { get; set; }

        [Required]
        public required DateTime DateOfDeath { get; set; }

        [Required]
        public required string Gender { get; set; }

        public string? CauseOfDeath { get; set; }

        // =========================================================
        // POLICY
        // =========================================================

        [Required]
        public required string PolicyId { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        // =========================================================
        // BENEFICIARY
        // =========================================================

        [Required]
        public string BeneficiaryId { get; set; } = string.Empty;

        [ForeignKey(nameof(BeneficiaryId))]
        public virtual Beneficiary? Beneficiary { get; set; }

        // =========================================================
        // RELEASE STATUS
        // =========================================================

        [Required]
        public bool IsReleased { get; private set; }

        // =========================================================
        // DEFAULT CONSTRUCTOR
        // =========================================================

        [SetsRequiredMembers]
        public Deceased()
        {
            DeceasedId = Guid.NewGuid().ToString();

            FullName = string.Empty;
            IDNumber = string.Empty;
            Gender = string.Empty;
            PolicyId = string.Empty;
            BeneficiaryId = string.Empty;

            IsReleased = false;
        }

        // =========================================================
        // CONSTRUCTOR
        // =========================================================

        [SetsRequiredMembers]
        public Deceased(
            string fullName,
            string idNumber,
            DateTime dateOfBirth,
            DateTime dateOfDeath,
            string gender,
            string policyId,
            string beneficiaryId,
            string? causeOfDeath)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException(
                    "Full name is required.",
                    nameof(fullName));

            if (string.IsNullOrWhiteSpace(idNumber))
                throw new ArgumentException(
                    "ID number is required.",
                    nameof(idNumber));

            if (string.IsNullOrWhiteSpace(gender))
                throw new ArgumentException(
                    "Gender is required.",
                    nameof(gender));

            if (string.IsNullOrWhiteSpace(policyId))
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));

            if (string.IsNullOrWhiteSpace(beneficiaryId))
                throw new ArgumentException(
                    "Beneficiary ID is required.",
                    nameof(beneficiaryId));

            DeceasedId = Guid.NewGuid().ToString();

            FullName = fullName;
            IDNumber = idNumber;
            DateOfBirth = dateOfBirth;
            DateOfDeath = dateOfDeath;
            Gender = gender;
            PolicyId = policyId;
            BeneficiaryId = beneficiaryId;
            CauseOfDeath = causeOfDeath;

            IsReleased = false;
        }

        // =========================================================
        // UPDATE DETAILS
        // =========================================================

        public void UpdateDetails(
            string fullName,
            string gender,
            string? causeOfDeath)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException(
                    "Full name is required.",
                    nameof(fullName));

            if (string.IsNullOrWhiteSpace(gender))
                throw new ArgumentException(
                    "Gender is required.",
                    nameof(gender));

            FullName = fullName;
            Gender = gender;
            CauseOfDeath = causeOfDeath;
        }

        // =========================================================
        // RELEASE
        // =========================================================

        public void Release()
        {
            if (IsReleased)
            {
                throw new InvalidOperationException(
                    "Deceased has already been released.");
            }

            IsReleased = true;
        }
    }
}