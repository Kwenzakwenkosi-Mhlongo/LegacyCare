// ============================================================
// File: Service/PolicyManagement/IPackageChangeRequestService.cs
// ============================================================

using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IPackageChangeRequestService
    {
        IEnumerable<ChangePackageRequest> GetAllRequests();

        ChangePackageRequest GetRequestById(
            string requestId);

        IEnumerable<ChangePackageRequest> GetRequestsByPolicy(
            string policyId);

        IEnumerable<ChangePackageRequest> GetRequestsByPolicyForClient(
            string policyId,
            string userId);

        ChangePackageRequest CreateRequest(
            ChangePackageRequest request,
            string userId);

        void ApproveRequest(
            string requestId);

        void RejectRequest(
            string requestId);

        void DeleteRequest(
            string requestId);
    }
}
