using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models;
using PolicyManagement.Enums;

namespace PolicyManagement.Service.PolicyManagement
{
    public class BeneficiaryRequestService : IBeneficiaryRequestService
    {
        private readonly AppDbContext _context;
        private readonly IBeneficiaryService _beneficiaryService;

        public BeneficiaryRequestService(AppDbContext context, IBeneficiaryService beneficiaryService)
        {
            _context = context;
            _beneficiaryService = beneficiaryService;
        }

        public IEnumerable<BeneficiaryRequest> GetAllRequests()
        {
            return _context.BeneficiaryRequest
                .Include(r => r.User)
                .Include(r => r.Policy)
                .ToList();
        }

        public BeneficiaryRequest GetRequestById(string requestId)
        {
            var request = _context.BeneficiaryRequest
                .Include(r => r.User)
                .Include(r => r.Policy)
                .FirstOrDefault(r => r.RequestId == requestId);

            if (request == null)
                throw new KeyNotFoundException("Request not found.");

            return request;
        }

        public IEnumerable<BeneficiaryRequest> GetRequestsByPolicy(string policyId)
        {
            return _context.BeneficiaryRequest
                .Where(r => r.PolicyId == policyId)
                .ToList();
        }

        public BeneficiaryRequest CreateRequest(BeneficiaryRequest request)
        {
            try
            {
                bool policyExists = _context.Policy
                    .Any(p => p.PolicyId == request.PolicyId);

                if (!policyExists)
                    throw new KeyNotFoundException("Policy not found.");

                bool userExists = _context.Users
                    .Any(u => u.UserId == request.UserId);

                if (!userExists)
                    throw new KeyNotFoundException("User not found.");

                if (string.IsNullOrEmpty(request.RequestId))
                    request.RequestId = Guid.NewGuid().ToString();

                if (request.RequestDate == default)
                    request.RequestDate = DateTime.Now;

                if (request.Status == 0)
                    request.Status = RequestStatus.Pending;

                if (request.RequestType == RequestType.Add)
                {
                    request.BeneficiaryId = null;
                }
                else if (request.RequestType == RequestType.Remove)
                {
                    request.FullName = null;
                    request.IDNumber = null;
                }

                _context.BeneficiaryRequest.Add(request);
                _context.SaveChanges();

                return request;
            }
            catch (DbUpdateException ex)
            {
                var innerMessage = ex.InnerException?.Message ?? ex.Message;
                throw new Exception($"Database error: {innerMessage}");
            }
        }

        public void ApproveRequest(string requestId)
        {
            var request = GetRequestById(requestId);

            switch (request.RequestType)
            {
                case RequestType.Add:
                    var beneficiary = new Beneficiary
                    {
                        FullName = request.FullName!,
                        IDNumber = request.IDNumber!,
                        Relationship = request.Relationship,
                        Status = BeneficiaryStatus.Active,
                        PolicyId = request.PolicyId
                    };
                    _beneficiaryService.CreateBeneficiary(beneficiary);
                    break;

                case RequestType.Remove:
                    if (string.IsNullOrWhiteSpace(request.BeneficiaryId))
                        throw new InvalidOperationException("BeneficiaryId is required.");

                    _beneficiaryService.RemoveBeneficiary(request.BeneficiaryId);
                    break;

                case RequestType.Update:
                    if (string.IsNullOrWhiteSpace(request.BeneficiaryId))
                        throw new InvalidOperationException("BeneficiaryId is required for update.");

                    var updatedBeneficiary = new Beneficiary
                    {
                        FullName = request.FullName!,
                        Relationship = request.Relationship,
                        IDNumber = request.IDNumber!,
                        Status = BeneficiaryStatus.Active,
                        PolicyId = request.PolicyId
                    };
                    _beneficiaryService.UpdateBeneficiary(request.BeneficiaryId, updatedBeneficiary);
                    break;
            }

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
            _context.BeneficiaryRequest.Remove(request);
            _context.SaveChanges();
        }
    }
}