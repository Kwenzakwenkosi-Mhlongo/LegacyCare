using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class PackageChangeRequestService : IPackageChangeRequestService
    {
        private readonly AppDbContext _context;
        private readonly IPolicyService _policyService;

        public PackageChangeRequestService(AppDbContext context, IPolicyService policyService)
        {
            _context = context;
            _policyService = policyService;
        }

        public IEnumerable<ChangePackageRequest> GetAllRequests()
        {
            return _context.ChangePackageRequest
                .Include(r => r.User)
                .Include(r => r.Policy)
                .Include(r => r.NewPackage)
                .ToList();
        }

        public ChangePackageRequest GetRequestById(string requestId)
        {
            var request = _context.ChangePackageRequest
                .Include(r => r.User)
                .Include(r => r.Policy)
                .Include(r => r.NewPackage)
                .FirstOrDefault(r => r.RequestId == requestId);

            if (request == null)
                throw new KeyNotFoundException("Request not found.");

            return request;
        }

        public IEnumerable<ChangePackageRequest> GetRequestsByPolicy(string policyId)
        {
            return _context.ChangePackageRequest
                .Where(r => r.PolicyId == policyId)
                .ToList();
        }

        public ChangePackageRequest CreateRequest(ChangePackageRequest request)
        {
            bool policyExists = _context.Policy
                .Any(p => p.PolicyId == request.PolicyId);

            if (!policyExists)
                throw new KeyNotFoundException("Policy not found.");

            bool packageExists = _context.Package
                .Any(p => p.PackageId == request.NewPackageId);

            if (!packageExists)
                throw new KeyNotFoundException("Package not found.");

            // Set UserId if not set
            if (string.IsNullOrEmpty(request.UserId))
            {
                throw new InvalidOperationException("UserId is required.");
            }

            _context.ChangePackageRequest.Add(request);
            _context.SaveChanges();

            return request;
        }

        public void ApproveRequest(string requestId)
        {
            var request = GetRequestById(requestId);
            _policyService.ChangePackage(request.PolicyId, request.NewPackageId);
            request.Approve();
            _context.SaveChanges();
        }

        public void RejectRequest(string requestId)
        {
            var request = GetRequestById(requestId);
            request.Reject();
            _context.SaveChanges();
        }

        public void DeleteRequest(string requestId)
        {
            var request = GetRequestById(requestId);
            _context.ChangePackageRequest.Remove(request);
            _context.SaveChanges();
        }
    }
}