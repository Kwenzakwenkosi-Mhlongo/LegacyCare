using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models
{
    public class PackageChangeRequestItem
    {
        [Key]
        public string PackageChangeRequestItemId { get; set; } = string.Empty;

        [Required]
        public string RequestId { get; set; } = string.Empty;

        [Required]
        public string PackageItemId { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyPremiumContribution { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceValue { get; set; }

        public DateTime DateCreated { get; set; }

        [ForeignKey(nameof(RequestId))]
        public virtual ChangePackageRequest? Request { get; set; }

        [ForeignKey(nameof(PackageItemId))]
        public virtual PackageItem? PackageItem { get; set; }

        public PackageChangeRequestItem()
        {
            PackageChangeRequestItemId = Guid.NewGuid().ToString();
            DateCreated = DateTime.UtcNow;
        }

        public PackageChangeRequestItem(
            string requestId,
            string packageItemId,
            decimal monthlyPremiumContribution,
            decimal serviceValue)
        {
            if (string.IsNullOrWhiteSpace(requestId))
            {
                throw new ArgumentException(
                    "Request ID is required.",
                    nameof(requestId));
            }

            if (string.IsNullOrWhiteSpace(packageItemId))
            {
                throw new ArgumentException(
                    "Package item ID is required.",
                    nameof(packageItemId));
            }

            if (monthlyPremiumContribution < 0)
            {
                throw new ArgumentException(
                    "Monthly premium contribution cannot be negative.",
                    nameof(monthlyPremiumContribution));
            }

            if (serviceValue < 0)
            {
                throw new ArgumentException(
                    "Service value cannot be negative.",
                    nameof(serviceValue));
            }

            PackageChangeRequestItemId = Guid.NewGuid().ToString();
            RequestId = requestId;
            PackageItemId = packageItemId;
            MonthlyPremiumContribution =
                monthlyPremiumContribution;
            ServiceValue = serviceValue;
            DateCreated = DateTime.UtcNow;
        }
    }
}