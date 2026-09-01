// ============================================================================
// File: Service/PolicyManagement/BeneficiaryRequestService.cs
// ============================================================================

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Enums;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class BeneficiaryRequestService(
        AppDbContext context) :
        IBeneficiaryRequestService
    {
        private readonly AppDbContext _context = context;

        public IEnumerable<BeneficiaryRequest> GetAllRequests()
        {
            return [.. _context.BeneficiaryRequest
                .AsNoTracking()
                .Include(request => request.User)
                .Include(request => request.Policy)
                .Include(request => request.Beneficiary)
                .OrderByDescending(request => request.RequestDate)];
        }

        public BeneficiaryRequest GetRequestById(
            string requestId)
        {
            ValidateRequestId(requestId);

            var request =
                _context.BeneficiaryRequest
                    .AsNoTracking()
                    .Include(item => item.User)
                    .Include(item => item.Policy)
                    .Include(item => item.Beneficiary)
                    .FirstOrDefault(item =>
                        item.RequestId == requestId);

            if (request == null)
            {
                throw new KeyNotFoundException(
                    "Beneficiary request not found.");
            }

            return request;
        }

        public IEnumerable<BeneficiaryRequest>
            GetRequestsByPolicy(
                string policyId)
        {
            ValidatePolicyId(policyId);

            return _context.BeneficiaryRequest
                .AsNoTracking()
                .Include(request => request.User)
                .Include(request => request.Policy)
                .Include(request => request.Beneficiary)
                .Where(request =>
                    request.PolicyId == policyId)
                .OrderByDescending(request =>
                    request.RequestDate)
                .ToList();
        }

        public IEnumerable<BeneficiaryRequest>
            GetRequestsByPolicyForClient(
                string policyId,
                string userId)
        {
            EnsureClientOwnsPolicy(
                policyId,
                userId);

            return _context.BeneficiaryRequest
                .AsNoTracking()
                .Include(request => request.Beneficiary)
                .Where(request =>
                    request.PolicyId == policyId &&
                    request.UserId == userId)
                .OrderByDescending(request =>
                    request.RequestDate)
                .ToList();
        }

        public BeneficiaryRequest CreateRequest(
            BeneficiaryRequest request,
            string userId)
        {
            ArgumentNullException.ThrowIfNull(request);

            ValidateUserId(userId);
            ValidatePolicyId(request.PolicyId);

            var policy =
                _context.Policy
                    .Include(item => item.Package)
                    .FirstOrDefault(item =>
                        item.PolicyId == request.PolicyId &&
                        item.UserId == userId)
                ?? throw new KeyNotFoundException(
                    "Policy not found or does not belong to this client.");

            switch (request.RequestType)
            {
                case RequestType.Add:
                    ValidateAddRequest(
                        request,
                        policy);
                    break;

                case RequestType.Update:
                    ValidateUpdateRequest(
                        request,
                        policy);
                    break;

                case RequestType.Remove:
                    ValidateRemoveRequest(
                        request,
                        policy);
                    break;

                default:
                    throw new InvalidOperationException(
                        "Unsupported beneficiary request type.");
            }

            request.RequestId =
                Guid.NewGuid().ToString();

            request.UserId =
                userId;

            request.RequestDate =
                DateTime.UtcNow;

            request.Status =
                RequestStatus.Pending;

            request.User = null;
            request.Policy = null;
            request.Beneficiary = null;

            _context.BeneficiaryRequest.Add(
                request);

            _context.SaveChanges();

            return GetRequestById(
                request.RequestId);
        }

        public void ApproveRequest(
            string requestId)
        {
            ValidateRequestId(requestId);

            using var transaction =
                _context.Database.BeginTransaction();

            try
            {
                var request =
                    _context.BeneficiaryRequest
                        .FirstOrDefault(item =>
                            item.RequestId == requestId)
                    ?? throw new KeyNotFoundException(
                        "Beneficiary request not found.");

                if (request.Status !=
                    RequestStatus.Pending)
                {
                    throw new InvalidOperationException(
                        "Only pending beneficiary requests can be approved.");
                }

                var policy =
                    _context.Policy
                        .Include(item => item.Package)
                        .FirstOrDefault(item =>
                            item.PolicyId ==
                            request.PolicyId)
                    ?? throw new KeyNotFoundException(
                        "Policy linked to this request was not found.");

                switch (request.RequestType)
                {
                    case RequestType.Add:
                        ApproveAddRequest(
                            request,
                            policy);
                        break;

                    case RequestType.Update:
                        ApproveUpdateRequest(
                            request,
                            policy);
                        break;

                    case RequestType.Remove:
                        ApproveRemoveRequest(
                            request,
                            policy);
                        break;

                    default:
                        throw new InvalidOperationException(
                            "Unsupported beneficiary request type.");
                }

                request.Status =
                    RequestStatus.Approved;

                _context.SaveChanges();

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public void RejectRequest(
            string requestId)
        {
            ValidateRequestId(requestId);

            var request =
                _context.BeneficiaryRequest
                    .FirstOrDefault(item =>
                        item.RequestId == requestId)
                ?? throw new KeyNotFoundException(
                    "Beneficiary request not found.");

            if (request.Status !=
                RequestStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending beneficiary requests can be rejected.");
            }

            request.Status =
                RequestStatus.Rejected;

            _context.SaveChanges();
        }

        public void DeleteRequest(
            string requestId)
        {
            ValidateRequestId(requestId);

            var request =
                _context.BeneficiaryRequest
                    .FirstOrDefault(item =>
                        item.RequestId == requestId)
                ?? throw new KeyNotFoundException(
                    "Beneficiary request not found.");

            _context.BeneficiaryRequest.Remove(
                request);

            _context.SaveChanges();
        }

        private void ValidateAddRequest(
            BeneficiaryRequest request,
            Policy policy)
        {
            ValidateBeneficiaryDetails(
                request);

            if (policy.Package == null)
            {
                throw new InvalidOperationException(
                    "The policy does not have a valid package.");
            }

            var activeCount =
                _context.Beneficiary.Count(
                    beneficiary =>
                        beneficiary.PolicyId ==
                            policy.PolicyId &&
                        beneficiary.Status ==
                            BeneficiaryStatus.Alive);

            var pendingAddCount =
                _context.BeneficiaryRequest.Count(
                    existing =>
                        existing.PolicyId ==
                            policy.PolicyId &&
                        existing.RequestType ==
                            RequestType.Add &&
                        existing.Status ==
                            RequestStatus.Pending);

            if (
                activeCount +
                pendingAddCount >=
                policy.Package.MaxBeneficiaries)
            {
                throw new InvalidOperationException(
                    $"This policy has reached its beneficiary limit of {policy.Package.MaxBeneficiaries}, including pending additions.");
            }

            var idNumber =
                request.IDNumber!.Trim();

            var duplicateActive =
                _context.Beneficiary.Any(
                    beneficiary =>
                        beneficiary.PolicyId ==
                            policy.PolicyId &&
                        beneficiary.IDNumber ==
                            idNumber &&
                        beneficiary.Status ==
                            BeneficiaryStatus.Alive);

            if (duplicateActive)
            {
                throw new InvalidOperationException(
                    "An active beneficiary with this ID number already exists on the policy.");
            }

            var duplicatePending =
                _context.BeneficiaryRequest.Any(
                    existing =>
                        existing.PolicyId ==
                            policy.PolicyId &&
                        existing.RequestType ==
                            RequestType.Add &&
                        existing.Status ==
                            RequestStatus.Pending &&
                        existing.IDNumber ==
                            idNumber);

            if (duplicatePending)
            {
                throw new InvalidOperationException(
                    "A pending Add Beneficiary request already exists for this ID number.");
            }
        }

        private void ValidateUpdateRequest(
            BeneficiaryRequest request,
            Policy policy)
        {
            ValidateBeneficiaryId(
                request.BeneficiaryId);

            ValidateBeneficiaryDetails(
                request);

            var beneficiary =
                FindPolicyBeneficiary(
                    request.BeneficiaryId!,
                    policy.PolicyId);

            if (beneficiary.Status !=
                BeneficiaryStatus.Alive)
            {
                throw new InvalidOperationException(
                    "Only active beneficiaries can be updated.");
            }

            var hasPendingRequest =
                HasPendingRequestForBeneficiary(
                    policy.PolicyId,
                    beneficiary.BeneficiaryId);

            if (hasPendingRequest)
            {
                throw new InvalidOperationException(
                    "This beneficiary already has a pending change request.");
            }

            var idNumber =
                request.IDNumber!.Trim();

            var duplicateId =
                _context.Beneficiary.Any(
                    item =>
                        item.PolicyId ==
                            policy.PolicyId &&
                        item.BeneficiaryId !=
                            beneficiary.BeneficiaryId &&
                        item.IDNumber ==
                            idNumber &&
                        item.Status ==
                            BeneficiaryStatus.Alive);

            if (duplicateId)
            {
                throw new InvalidOperationException(
                    "Another active beneficiary with this ID number already exists on the policy.");
            }
        }

        private void ValidateRemoveRequest(
            BeneficiaryRequest request,
            Policy policy)
        {
            ValidateBeneficiaryId(
                request.BeneficiaryId);

            var beneficiary =
                FindPolicyBeneficiary(
                    request.BeneficiaryId!,
                    policy.PolicyId);

            if (beneficiary.Status !=
                BeneficiaryStatus.Alive)
            {
                throw new InvalidOperationException(
                    "Only active beneficiaries can be removed.");
            }

            if (HasPendingRequestForBeneficiary(
                policy.PolicyId,
                beneficiary.BeneficiaryId))
            {
                throw new InvalidOperationException(
                    "This beneficiary already has a pending change request.");
            }
        }

        private void ApproveAddRequest(
            BeneficiaryRequest request,
            Policy policy)
        {
            ValidateBeneficiaryDetails(
                request);

            if (policy.Package == null)
            {
                throw new InvalidOperationException(
                    "The policy does not have a valid package.");
            }

            var activeCount =
                _context.Beneficiary.Count(
                    beneficiary =>
                        beneficiary.PolicyId ==
                            policy.PolicyId &&
                        beneficiary.Status ==
                            BeneficiaryStatus.Alive);

            if (activeCount >=
                policy.Package.MaxBeneficiaries)
            {
                throw new InvalidOperationException(
                    $"This policy already has the maximum of {policy.Package.MaxBeneficiaries} active beneficiaries.");
            }

            var idNumber =
                request.IDNumber!.Trim();

            var duplicateActive =
                _context.Beneficiary.Any(
                    beneficiary =>
                        beneficiary.PolicyId ==
                            policy.PolicyId &&
                        beneficiary.IDNumber ==
                            idNumber &&
                        beneficiary.Status ==
                            BeneficiaryStatus.Alive);

            if (duplicateActive)
            {
                throw new InvalidOperationException(
                    "An active beneficiary with this ID number already exists on the policy.");
            }

            var beneficiary =
                new Beneficiary
                {
                    BeneficiaryId =
                        Guid.NewGuid().ToString(),

                    PolicyId =
                        policy.PolicyId,

                    FullName =
                        request.FullName!.Trim(),

                    IDNumber =
                        idNumber,

                    DateOfBirth =
                        request.DateOfBirth,

                    Gender =
                        request.Gender!.Trim(),

                    Relationship =
                        request.Relationship,

                    Status =
                        BeneficiaryStatus.Alive
                };

            _context.Beneficiary.Add(
                beneficiary);
        }

        private void ApproveUpdateRequest(
            BeneficiaryRequest request,
            Policy policy)
        {
            ValidateBeneficiaryId(
                request.BeneficiaryId);

            ValidateBeneficiaryDetails(
                request);

            var beneficiary =
                FindPolicyBeneficiary(
                    request.BeneficiaryId!,
                    policy.PolicyId);

            if (beneficiary.Status !=
                BeneficiaryStatus.Alive)
            {
                throw new InvalidOperationException(
                    "Only active beneficiaries can be updated.");
            }

            var idNumber =
                request.IDNumber!.Trim();

            var duplicateId =
                _context.Beneficiary.Any(
                    item =>
                        item.PolicyId ==
                            policy.PolicyId &&
                        item.BeneficiaryId !=
                            beneficiary.BeneficiaryId &&
                        item.IDNumber ==
                            idNumber &&
                        item.Status ==
                            BeneficiaryStatus.Alive);

            if (duplicateId)
            {
                throw new InvalidOperationException(
                    "Another active beneficiary with this ID number already exists on the policy.");
            }

            beneficiary.FullName =
                request.FullName!.Trim();

            beneficiary.IDNumber =
                idNumber;

            beneficiary.DateOfBirth =
                request.DateOfBirth;

            beneficiary.Gender =
                request.Gender!.Trim();

            beneficiary.Relationship =
                request.Relationship;
        }

        private void ApproveRemoveRequest(
            BeneficiaryRequest request,
            Policy policy)
        {
            ValidateBeneficiaryId(
                request.BeneficiaryId);

            var beneficiary =
                FindPolicyBeneficiary(
                    request.BeneficiaryId!,
                    policy.PolicyId);

            if (beneficiary.Status !=
                BeneficiaryStatus.Alive)
            {
                throw new InvalidOperationException(
                    "Only active beneficiaries can be removed.");
            }

            beneficiary.Status =
                BeneficiaryStatus.Removed;
        }

        private Beneficiary FindPolicyBeneficiary(
            string beneficiaryId,
            string policyId)
        {
            return _context.Beneficiary
                .FirstOrDefault(item =>
                    item.BeneficiaryId ==
                        beneficiaryId &&
                    item.PolicyId ==
                        policyId)
                ?? throw new KeyNotFoundException(
                    "Beneficiary was not found on this policy.");
        }

        private bool HasPendingRequestForBeneficiary(
            string policyId,
            string beneficiaryId)
        {
            return _context.BeneficiaryRequest
                .Any(existing =>
                    existing.PolicyId ==
                        policyId &&
                    existing.BeneficiaryId ==
                        beneficiaryId &&
                    existing.Status ==
                        RequestStatus.Pending);
        }

        private void EnsureClientOwnsPolicy(
            string policyId,
            string userId)
        {
            ValidatePolicyId(policyId);
            ValidateUserId(userId);

            var ownsPolicy =
                _context.Policy
                    .AsNoTracking()
                    .Any(policy =>
                        policy.PolicyId ==
                            policyId &&
                        policy.UserId ==
                            userId);

            if (!ownsPolicy)
            {
                throw new KeyNotFoundException(
                    "Policy not found or does not belong to this client.");
            }
        }

        private static void ValidateBeneficiaryDetails(
            BeneficiaryRequest request)
        {
            if (string.IsNullOrWhiteSpace(
                request.FullName))
            {
                throw new InvalidOperationException(
                    "Beneficiary full name is required.");
            }

            if (string.IsNullOrWhiteSpace(
                request.IDNumber))
            {
                throw new InvalidOperationException(
                    "Beneficiary ID number is required.");
            }

            if (request.DateOfBirth == default)
            {
                throw new InvalidOperationException(
                    "Beneficiary date of birth is required.");
            }

            if (string.IsNullOrWhiteSpace(
                request.Gender))
            {
                throw new InvalidOperationException(
                    "Beneficiary gender is required.");
            }
        }

        private static void ValidateBeneficiaryId(
            string? beneficiaryId)
        {
            if (string.IsNullOrWhiteSpace(
                beneficiaryId))
            {
                throw new InvalidOperationException(
                    "Beneficiary ID is required.");
            }
        }

        private static void ValidateRequestId(
            string requestId)
        {
            if (string.IsNullOrWhiteSpace(
                requestId))
            {
                throw new ArgumentException(
                    "Request ID is required.",
                    nameof(requestId));
            }
        }

        private static void ValidatePolicyId(
            string policyId)
        {
            if (string.IsNullOrWhiteSpace(
                policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }
        }

        private static void ValidateUserId(
            string userId)
        {
            if (string.IsNullOrWhiteSpace(
                userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }
        }
    }
}