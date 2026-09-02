
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models
{
    public class PolicyCustomPackageItem
    {
        [Key]
        public string PolicyCustomPackageItemId { get; set; } = string.Empty;

        [Required]
        public string PolicyCustomPackageId { get; set; } = string.Empty;

        [Required]
        public string PackageItemId { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyPremiumContribution { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceValue { get; set; }

        public DateTime DateCreated { get; set; }

        [ForeignKey(nameof(PolicyCustomPackageId))]
        public virtual PolicyCustomPackage? PolicyCustomPackage { get; set; }

        [ForeignKey(nameof(PackageItemId))]
        public virtual PackageItem? PackageItem { get; set; }

        public PolicyCustomPackageItem()
        {
            PolicyCustomPackageItemId = Guid.NewGuid().ToString();
            DateCreated = DateTime.UtcNow;
        }

        public PolicyCustomPackageItem(
            string policyCustomPackageId,
            string packageItemId,
            decimal monthlyPremiumContribution,
            decimal serviceValue)
        {
            if (string.IsNullOrWhiteSpace(policyCustomPackageId))
            {
                throw new ArgumentException(
                    "Policy custom package ID is required.",
                    nameof(policyCustomPackageId));
            }

            if (string.IsNullOrWhiteSpace(packageItemId))
            {
                throw new ArgumentException(
                    "Package item ID is required.",
                    nameof(packageItemId));
            }

            if (monthlyPremiumContribution <= 0)
            {
                throw new ArgumentException(
                    "Monthly premium contribution must be greater than zero.",
                    nameof(monthlyPremiumContribution));
            }

            if (serviceValue <= 0)
            {
                throw new ArgumentException(
                    "Service value must be greater than zero.",
                    nameof(serviceValue));
            }

            PolicyCustomPackageItemId = Guid.NewGuid().ToString();
            PolicyCustomPackageId = policyCustomPackageId;
            PackageItemId = packageItemId;
            MonthlyPremiumContribution = monthlyPremiumContribution;
            ServiceValue = serviceValue;
            DateCreated = DateTime.UtcNow;
        }
    }
}
