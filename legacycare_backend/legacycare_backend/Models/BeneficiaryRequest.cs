using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using PolicyManagement.Enums;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models
{
    public class BeneficiaryRequest
    {
        [Key]
        public string RequestId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string PolicyId { get; set; } = string.Empty;

        [Required]
        public RequestType RequestType { get; set; } 

        [Required]
        public RequestStatus Status { get; set; }

        [Required]
        public DateTime RequestDate { get; set; }

        public string? Description { get; set; } = string.Empty;

        //Existing beneficiary (for Remove/Update requests)
        public string? BeneficiaryId { get; set; } = string.Empty;

        //New beneficiary information (for Add/Update requests)
        public string? FullName { get; set; } = string.Empty;

        public BeneficiaryRelationship Relationship { get; set; }

        public string? IDNumber { get; set; }

        //Navigation Properties

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        [ForeignKey(nameof(BeneficiaryId))]
        public virtual Beneficiary? Beneficiary { get; set; }


        [SetsRequiredMembers]
        public BeneficiaryRequest()
        {
            RequestId = Guid.NewGuid().ToString();
            RequestDate = DateTime.Now;
            Status = RequestStatus.Pending;
        }

        [SetsRequiredMembers]
        public BeneficiaryRequest(string userId,string policyId,RequestType requestType)
        {
            RequestId = Guid.NewGuid().ToString();
            UserId = userId;
            PolicyId = policyId;
            RequestType = requestType;

            RequestDate = DateTime.Now;
            Status = RequestStatus.Pending;
        }

        public void Approve()
        {
            if (Status != RequestStatus.Pending)
                throw new InvalidOperationException(
                    "Only pending requests can be approved.");

            Status = RequestStatus.Approved;
        }

        public void Reject()
        {
            if (Status != RequestStatus.Pending)
                throw new InvalidOperationException(
                    "Only pending requests can be rejected.");

            Status = RequestStatus.Rejected;
        }

        public void UpdateDescription(string description)
        {
            Description = description;
        }

        public void SetBeneficiaryToRemove(string beneficiaryId)
        {
            BeneficiaryId = beneficiaryId;
        }

        public void SetNewBeneficiary(string fullName,BeneficiaryRelationship relationship,string idNumber)
        {
            FullName = fullName;
            Relationship = relationship;
            IDNumber = idNumber;
        }
    }
}