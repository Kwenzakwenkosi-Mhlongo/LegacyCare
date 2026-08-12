namespace PolicyManagement.DTOs.PolicyManagement
{
    public class ChangePolicyResult
    {
        public string PreviousPolicyId { get; set; } = string.Empty;
        public string NewPolicyId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string PackageId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int BeneficiariesCopied { get; set; }
    }
}