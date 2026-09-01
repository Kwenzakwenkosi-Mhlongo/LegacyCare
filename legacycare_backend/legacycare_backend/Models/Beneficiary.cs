// FILE: Models/Beneficiary.cs

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;

namespace PolicyManagement.Models
{
    public class Beneficiary
    {
        [Key]
        public string BeneficiaryId { get; set; }
            = Guid.NewGuid().ToString();

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string IDNumber { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        [StringLength(20)]
        public string Gender { get; set; } = string.Empty;

        [Required]
        public BeneficiaryRelationship Relationship { get; set; }

        public BeneficiaryStatus Status { get; set; }
            = BeneficiaryStatus.Alive;

        [Required]
        public string PolicyId { get; set; } = string.Empty;

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        public Beneficiary()
        {
            BeneficiaryId = Guid.NewGuid().ToString();
            Status = BeneficiaryStatus.Alive;
        }

        public Beneficiary(
            string fullName,
            string idNumber,
            DateTime dateOfBirth,
            string gender,
            BeneficiaryRelationship relationship,
            string policyId)
        {
            BeneficiaryId = Guid.NewGuid().ToString();

            FullName = fullName;
            IDNumber = idNumber;
            DateOfBirth = dateOfBirth;
            Gender = gender;
            Relationship = relationship;
            PolicyId = policyId;
            Status = BeneficiaryStatus.Alive;
        }

        public void UpdateDetails(
            string fullName,
            DateTime dateOfBirth,
            string gender,
            BeneficiaryRelationship relationship)
        {
            if (string.IsNullOrWhiteSpace(fullName))
            {
                throw new ArgumentException(
                    "Full name is required.",
                    nameof(fullName));
            }

            if (dateOfBirth == default)
            {
                throw new ArgumentException(
                    "Date of birth is required.",
                    nameof(dateOfBirth));
            }

            if (dateOfBirth.Date > DateTime.UtcNow.Date)
            {
                throw new ArgumentException(
                    "Date of birth cannot be in the future.",
                    nameof(dateOfBirth));
            }

            if (string.IsNullOrWhiteSpace(gender))
            {
                throw new ArgumentException(
                    "Gender is required.",
                    nameof(gender));
            }

            FullName = fullName.Trim();
            DateOfBirth = dateOfBirth;
            Gender = gender.Trim();
            Relationship = relationship;
        }

        public void MarkAsDeceased()
        {
            if (Status == BeneficiaryStatus.Removed)
            {
                throw new InvalidOperationException(
                    "A removed beneficiary cannot be marked as deceased.");
            }

            Status = BeneficiaryStatus.Deceased;
        }

        public void Remove()
        {
            if (Status == BeneficiaryStatus.Deceased)
            {
                throw new InvalidOperationException(
                    "A deceased beneficiary cannot be removed.");
            }

            Status = BeneficiaryStatus.Removed;
        }

        public void Reinstate()
        {
            if (Status == BeneficiaryStatus.Deceased)
            {
                throw new InvalidOperationException(
                    "A deceased beneficiary cannot be reinstated.");
            }

            Status = BeneficiaryStatus.Alive;
        }
    }
}