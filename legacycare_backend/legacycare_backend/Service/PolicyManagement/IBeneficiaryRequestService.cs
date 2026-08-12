using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IBeneficiaryRequestService
    {
        IEnumerable<BeneficiaryRequest> GetAllRequests();

        BeneficiaryRequest GetRequestById(string requestId);

        IEnumerable<BeneficiaryRequest> GetRequestsByPolicy(string policyId);

        BeneficiaryRequest CreateRequest(BeneficiaryRequest request);

        void ApproveRequest(string requestId);

        void RejectRequest(string requestId);

        void DeleteRequest(string requestId);
    }
}