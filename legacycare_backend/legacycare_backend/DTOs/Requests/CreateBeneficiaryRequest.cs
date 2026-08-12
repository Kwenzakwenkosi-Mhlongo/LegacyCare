using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class CreateBeneficiaryRequest
    {
        public string FullName { get; set; } = string.Empty;

        public string IDNumber { get; set; } = string.Empty;

        public BeneficiaryRelationship Relationship { get; set; }
    }
}