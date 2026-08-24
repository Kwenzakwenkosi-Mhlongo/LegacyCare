using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Responses
{
    public class BeneficiaryResponse
    {
        public string BeneficiaryId { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string IDNumber { get; set; } = string.Empty;

        public DateTime DateOfBirth { get; set; }

        public string Gender { get; set; } = string.Empty;

        public BeneficiaryRelationship Relationship { get; set; }

        public BeneficiaryStatus Status { get; set; }

        public string PolicyId { get; set; } = string.Empty;
    }
}