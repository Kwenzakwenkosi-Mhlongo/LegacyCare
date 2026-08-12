using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Responses
{
    public class PolicyResponse
    {
        public string PolicyId { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;

        public string ClientName { get; set; } = string.Empty;

        public string PackageId { get; set; } = string.Empty;

        public string PackageName { get; set; } = string.Empty;

        public double MonthlyPremium { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public PolicyStatus Status { get; set; }

        public List<BeneficiaryResponse> Beneficiaries { get; set; }
            = new();
    }
}