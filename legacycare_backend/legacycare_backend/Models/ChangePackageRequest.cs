using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models
{
    public class ChangePackageRequest
    {
        [Key]
        public string RequestId { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;

        public DateTime RequestDate { get; set; }

        // Used for normal package-change requests.
        // Nullable because CUSTOM_PACKAGE requests do not use a
        // predefined Package.
        public string? NewPackageId { get; set; }

        // Identifies whether this is a normal package request
        // or a custom package request.
        public PackageChangeRequestType RequestType { get; set; }

        public RequestStatus Status { get; set; }

        public string ClientId { get; set; } = string.Empty;

        public string PolicyId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        [ForeignKey(nameof(NewPackageId))]
        public virtual Package? NewPackage { get; set; }

        // Used by CUSTOM_PACKAGE requests.
        public virtual ICollection<PackageChangeRequestItem> Items { get; set; }
            = new List<PackageChangeRequestItem>();

        public ChangePackageRequest()
        {
            RequestId = Guid.NewGuid().ToString();
            RequestDate = DateTime.Now;
            Status = RequestStatus.Pending;
            RequestType = PackageChangeRequestType.NormalPackage;
        }

        public ChangePackageRequest(
            string userId,
            string newPackageId,
            string clientId,
            string policyId)
        {
            RequestId = Guid.NewGuid().ToString();
            UserId = userId;
            RequestDate = DateTime.Now;
            NewPackageId = newPackageId;
            RequestType = PackageChangeRequestType.NormalPackage;
            Status = RequestStatus.Pending;
            ClientId = clientId;
            PolicyId = policyId;
        }

        public void Approve()
        {
            if (Status != RequestStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending requests can be approved.");
            }

            Status = RequestStatus.Approved;
        }

        public void Reject()
        {
            if (Status != RequestStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending requests can be rejected.");
            }

            Status = RequestStatus.Rejected;
        }
    }
}