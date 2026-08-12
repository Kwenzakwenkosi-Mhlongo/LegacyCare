using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;

namespace PolicyManagement.Models
{
    public class Beneficiary
    {
        [Key]
        public string BeneficiaryId { get; set; }

        [StringLength(100)]
        public required string FullName { get; set; } = string.Empty;

        [StringLength(20)]
        public required string IDNumber { get; set; } = string.Empty;

        public required BeneficiaryRelationship Relationship { get; set; }

        public BeneficiaryStatus Status { get; set; } = BeneficiaryStatus.Active;

        public required string PolicyId { get; set; } = string.Empty;

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        public Beneficiary()
        {
            BeneficiaryId = Guid.NewGuid().ToString();
            Status = BeneficiaryStatus.Active;
        }

        public Beneficiary(string fullName, string idNumber, BeneficiaryRelationship relationship, string policyId)
        {
            BeneficiaryId = Guid.NewGuid().ToString();
            FullName = fullName;
            IDNumber = idNumber;
            Relationship = relationship;
            PolicyId = policyId;
            Status = BeneficiaryStatus.Active;
        }

        public void UpdateDetails(string fullName, BeneficiaryRelationship relationship)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException("Full name is required.");

            FullName = fullName;
            Relationship = relationship;
        }

        public void MarkAsDeceased()
        {
            Status = BeneficiaryStatus.Deceased;
        }

        public void Remove()
        {
            Status = BeneficiaryStatus.Removed;
        }

        public void Reinstate()
        {
            Status = BeneficiaryStatus.Active;
        }
    }
}