using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Enums;

namespace PolicyManagement.Models
{
    public class Policy
    {
        [Key]
        public string PolicyId { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string PackageId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public List<Beneficiary> Beneficiaries { get; set; } = new List<Beneficiary>();

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [ForeignKey(nameof(PackageId))]
        public virtual Package? Package { get; set; }
        public PolicyStatus Status { get; set; }

        public Policy()
        {
            PolicyId = Guid.NewGuid().ToString();
            StartDate = DateTime.Now;
            Status = PolicyStatus.Active;
            Beneficiaries = new List<Beneficiary>();
        }

        public Policy(string clientId, string packageId)
        {
            PolicyId = Guid.NewGuid().ToString();
            StartDate = DateTime.Now;
            UserId = clientId;
            PackageId = packageId;
            Status = PolicyStatus.Active;
            Beneficiaries = new List<Beneficiary>();
        }

        public void Activate()
        {
            Status = PolicyStatus.Active;
        }

        public void Cancel()
        {
            Status = PolicyStatus.Cancelled;
            EndDate = DateTime.Now;
        }

        public void Lapse()
        {
            Status = PolicyStatus.Lapsed;
            EndDate = DateTime.Now;
        }

        public void Expire()
        {
            Status = PolicyStatus.Expired;
            EndDate = DateTime.Now;
        }

        public void Discontinue()
        {
            if (Status == PolicyStatus.Discontinued)
                throw new InvalidOperationException("This policy is already discontinued.");

            Status = PolicyStatus.Discontinued;
            EndDate = DateTime.Now;
        }

        public void ChangePackage(string packageId)
        {
            if (string.IsNullOrWhiteSpace(packageId))
                throw new ArgumentException("PackageId cannot be empty.");

            PackageId = packageId;
        }

        public void ChangeStartDate(DateTime startDate)
        {
            if (startDate == default)
                throw new ArgumentException("Invalid start date.");

            StartDate = startDate;
        }

        public void AddBeneficiary(Beneficiary beneficiary)
        {
            if (beneficiary == null)
                throw new ArgumentNullException(nameof(beneficiary));

            Beneficiaries.Add(beneficiary);
        }

        public void RemoveBeneficiary(Beneficiary beneficiary)
        {
            if (beneficiary == null)
                throw new ArgumentNullException(nameof(beneficiary));

            Beneficiaries.Remove(beneficiary);
        }
    }
}