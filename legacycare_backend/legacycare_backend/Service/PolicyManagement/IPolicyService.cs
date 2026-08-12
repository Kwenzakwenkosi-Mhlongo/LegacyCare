using PolicyManagement.Models;
using PolicyManagement.Enums;
using PolicyManagement.DTOs.PolicyManagement;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IPolicyService
    {
        IEnumerable<Policy> GetAllPolicies();
        Policy GetPolicyById(string policyId);
        IEnumerable<Policy> GetPoliciesByUser(string userId);
        Policy CreatePolicy(Policy policy);
        Policy UpdatePolicy(string policyId, Policy updatedPolicy);
        void ActivatePolicy(string policyId);
        void CancelPolicy(string policyId);
        void DiscontinuePolicy(string policyId);
        void UpdatePolicyStatus(string policyId, PolicyStatus status);
        void ChangePackage(string policyId, string packageId);
        ChangePolicyResult ChangePolicyPackage(string currentPolicyId, string newPackageId);
        void DeletePolicy(string policyId);
        void AddBeneficiary(string policyId, Beneficiary beneficiary);
        void RemoveBeneficiary(string policyId, string beneficiaryId);
    }
}