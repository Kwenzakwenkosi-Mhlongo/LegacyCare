// ============================================================================
// File: Service/PolicyManagement/IBeneficiaryRequestService.cs
// ============================================================================

using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IBeneficiaryRequestService
    {
        IEnumerable<BeneficiaryRequest> GetAllRequests();

        BeneficiaryRequest GetRequestById(
            string requestId);

        IEnumerable<BeneficiaryRequest> GetRequestsByPolicy(
            string policyId);

        IEnumerable<BeneficiaryRequest> GetRequestsByPolicyForClient(
            string policyId,
            string userId);

        BeneficiaryRequest CreateRequest(
            BeneficiaryRequest request,
            string userId);

        void ApproveRequest(
            string requestId);

        void RejectRequest(
            string requestId);

        void DeleteRequest(
            string requestId);
    }
}

