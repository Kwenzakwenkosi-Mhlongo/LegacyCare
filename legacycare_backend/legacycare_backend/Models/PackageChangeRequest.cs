using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Enums;

namespace PolicyManagement.Models
{
    public class ChangePackageRequest
    {
        [Key]
        public string RequestId { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;

        public DateTime RequestDate { get; set; }

        public string NewPackageId { get; set; } = string.Empty;

        public RequestStatus Status { get; set; }

        public string ClientId { get; set; } = string.Empty;

        public string PolicyId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        [ForeignKey(nameof(NewPackageId))]
        public virtual Package? NewPackage { get; set; }

        public ChangePackageRequest()
        {
            RequestId = Guid.NewGuid().ToString();
            RequestDate = DateTime.Now;
            Status = RequestStatus.Pending;
        }

        public ChangePackageRequest(string userId, string newPackageId, string clientId, string policyId)
        {
            RequestId = Guid.NewGuid().ToString();
            UserId = userId;
            RequestDate = DateTime.Now;
            NewPackageId = newPackageId;
            Status = RequestStatus.Pending;
            ClientId = clientId;
            PolicyId = policyId;
        }

        public void Approve()
        {
            if (Status != RequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be approved.");
            Status = RequestStatus.Approved;
        }

        public void Reject()
        {
            if (Status != RequestStatus.Pending)
                throw new InvalidOperationException("Only pending requests can be rejected.");
            Status = RequestStatus.Rejected;
        }
    }
}