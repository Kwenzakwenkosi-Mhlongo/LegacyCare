// File: Service/PolicyManagement/PackageChangeRequestService.cs

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Enums;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class PackageChangeRequestService :
        IPackageChangeRequestService
    {
        private readonly AppDbContext _context;
        private readonly IPolicyService _policyService;

        public PackageChangeRequestService(
            AppDbContext context,
            IPolicyService policyService)
        {
            _context = context;
            _policyService = policyService;
        }

        public IEnumerable<ChangePackageRequest> GetAllRequests()
        {
            return _context.ChangePackageRequest
                .AsNoTracking()
                .Include(request => request.User)
                .Include(request => request.Policy)
                .Include(request => request.NewPackage)
                .OrderByDescending(request => request.RequestDate)
                .ToList();
        }

        public ChangePackageRequest GetRequestById(
            string requestId)
        {
            if (string.IsNullOrWhiteSpace(requestId))
            {
                throw new ArgumentException(
                    "Request ID is required.",
                    nameof(requestId));
            }

            var request =
                _context.ChangePackageRequest
                    .Include(item => item.User)
                    .Include(item => item.Policy)
                    .Include(item => item.NewPackage)
                    .FirstOrDefault(item =>
                        item.RequestId == requestId);

            if (request == null)
            {
                throw new KeyNotFoundException(
                    "Package change request not found.");
            }

            return request;
        }

        public IEnumerable<ChangePackageRequest> GetRequestsByPolicy(
            string policyId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            return _context.ChangePackageRequest
                .AsNoTracking()
                .Include(request => request.User)
                .Include(request => request.Policy)
                .Include(request => request.NewPackage)
                .Where(request =>
                    request.PolicyId == policyId)
                .OrderByDescending(request =>
                    request.RequestDate)
                .ToList();
        }

        public IEnumerable<ChangePackageRequest>
            GetRequestsByPolicyForClient(
                string policyId,
                string userId)
        {
            EnsureClientOwnsPolicy(
                policyId,
                userId);

            return _context.ChangePackageRequest
                .AsNoTracking()
                .Include(request => request.NewPackage)
                .Where(request =>
                    request.PolicyId == policyId &&
                    request.UserId == userId)
                .OrderByDescending(request =>
                    request.RequestDate)
                .ToList();
        }

        public ChangePackageRequest CreateRequest(
            ChangePackageRequest request,
            string userId)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }

            if (string.IsNullOrWhiteSpace(request.PolicyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.NewPackageId))
            {
                throw new ArgumentException(
                    "New package ID is required.",
                    nameof(request));
            }

            var client =
                _context.Client
                    .AsNoTracking()
                    .FirstOrDefault(item =>
                        item.UserId == userId);

            if (client == null)
            {
                throw new KeyNotFoundException(
                    "Client account was not found.");
            }

            if (string.IsNullOrWhiteSpace(client.ClientId))
            {
                throw new InvalidOperationException(
                    "The client account does not have a valid ClientId.");
            }

            var clientId =
                client.ClientId;

            var policy =
                _context.Policy
                    .Include(item => item.Package)
                    .FirstOrDefault(item =>
                        item.PolicyId == request.PolicyId &&
                        item.UserId == userId);

            if (policy == null)
            {
                throw new KeyNotFoundException(
                    "Policy not found or does not belong to this client.");
            }

            var newPackage =
                _context.Package
                    .AsNoTracking()
                    .FirstOrDefault(package =>
                        package.PackageId == request.NewPackageId);

            if (newPackage == null)
            {
                throw new KeyNotFoundException(
                    "Package not found.");
            }

            if (policy.PackageId == request.NewPackageId)
            {
                throw new InvalidOperationException(
                    "The selected package is already active on this policy.");
            }

            var hasPendingRequest =
                _context.ChangePackageRequest
                    .Any(existing =>
                        existing.PolicyId == request.PolicyId &&
                        existing.UserId == userId &&
                        existing.Status == RequestStatus.Pending);

            if (hasPendingRequest)
            {
                throw new InvalidOperationException(
                    "This policy already has a pending package change request.");
            }

            request.RequestId =
                Guid.NewGuid().ToString();

            request.UserId =
                userId;

            request.ClientId =
                clientId;

            request.RequestDate =
                DateTime.UtcNow;

            request.Status =
                RequestStatus.Pending;

            _context.ChangePackageRequest.Add(
                request);

            _context.SaveChanges();

            return GetRequestById(
                request.RequestId);
        }

        public void ApproveRequest(
            string requestId)
        {
            var request =
                GetRequestById(requestId);

            if (request.Status != RequestStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending package change requests can be approved.");
            }

            var policyExists =
                _context.Policy.Any(policy =>
                    policy.PolicyId == request.PolicyId);

            if (!policyExists)
            {
                throw new KeyNotFoundException(
                    "Policy linked to this request was not found.");
            }

            var packageExists =
                _context.Package.Any(package =>
                    package.PackageId == request.NewPackageId);

            if (!packageExists)
            {
                throw new KeyNotFoundException(
                    "Requested package was not found.");
            }

            _policyService.ChangePackage(
                request.PolicyId,
                request.NewPackageId);

            request.Approve();

            _context.SaveChanges();
        }

        public void RejectRequest(
            string requestId)
        {
            var request =
                GetRequestById(requestId);

            if (request.Status != RequestStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending package change requests can be rejected.");
            }

            request.Reject();

            _context.SaveChanges();
        }

        public void DeleteRequest(
            string requestId)
        {
            var request =
                GetRequestById(requestId);

            _context.ChangePackageRequest.Remove(
                request);

            _context.SaveChanges();
        }

        private void EnsureClientOwnsPolicy(
            string policyId,
            string userId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }

            var exists =
                _context.Policy
                    .AsNoTracking()
                    .Any(policy =>
                        policy.PolicyId == policyId &&
                        policy.UserId == userId);

            if (!exists)
            {
                throw new KeyNotFoundException(
                    "Policy not found or does not belong to this client.");
            }
        }
    }
}