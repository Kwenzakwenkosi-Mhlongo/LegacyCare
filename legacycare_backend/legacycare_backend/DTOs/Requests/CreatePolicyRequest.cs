

namespace PolicyManagement.DTOs.Requests
{
    public class CreatePolicyRequest
    {
        public string UserId { get; set; } = string.Empty;

        public string PackageId { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }

        public List<CreateBeneficiaryRequest> Beneficiaries { get; set; }
            = [];
    }
}