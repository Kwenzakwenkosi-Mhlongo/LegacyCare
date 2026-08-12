using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IPackageChangeRequestService
    {
        IEnumerable<ChangePackageRequest> GetAllRequests();

        ChangePackageRequest GetRequestById(string requestId);

        IEnumerable<ChangePackageRequest> GetRequestsByPolicy(string policyId);

        ChangePackageRequest CreateRequest(ChangePackageRequest request);

        void ApproveRequest(string requestId);

        void RejectRequest(string requestId);

        void DeleteRequest(string requestId);
    }
}