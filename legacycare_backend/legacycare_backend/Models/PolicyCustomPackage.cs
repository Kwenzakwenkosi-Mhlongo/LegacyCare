
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models
{
    public class PolicyCustomPackage
    {
        [Key]
        public string PolicyCustomPackageId { get; set; } = string.Empty;

        [Required]
        public string PolicyId { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal BaseMonthlyPremium { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CustomItemsMonthlyPremium { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal EffectiveMonthlyPremium { get; set; }

        public DateTime DateCreated { get; set; }

        public DateTime? DateUpdated { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy? Policy { get; set; }

        public virtual ICollection<PolicyCustomPackageItem> Items { get; set; }
            = new List<PolicyCustomPackageItem>();

        public PolicyCustomPackage()
        {
            PolicyCustomPackageId = Guid.NewGuid().ToString();
            DateCreated = DateTime.UtcNow;
        }

        public PolicyCustomPackage(
            string policyId,
            decimal baseMonthlyPremium)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            if (baseMonthlyPremium <= 0)
            {
                throw new ArgumentException(
                    "Base monthly premium must be greater than zero.",
                    nameof(baseMonthlyPremium));
            }

            PolicyCustomPackageId = Guid.NewGuid().ToString();
            PolicyId = policyId;
            BaseMonthlyPremium = baseMonthlyPremium;
            CustomItemsMonthlyPremium = 0;
            EffectiveMonthlyPremium = baseMonthlyPremium;
            DateCreated = DateTime.UtcNow;
        }

        public void RecalculatePremium()
        {
            CustomItemsMonthlyPremium =
                Items.Sum(item => item.MonthlyPremiumContribution);

            EffectiveMonthlyPremium =
                BaseMonthlyPremium +
                CustomItemsMonthlyPremium;

            DateUpdated = DateTime.UtcNow;
        }

        public void SetBaseMonthlyPremium(
            decimal baseMonthlyPremium)
        {
            if (baseMonthlyPremium <= 0)
            {
                throw new ArgumentException(
                    "Base monthly premium must be greater than zero.",
                    nameof(baseMonthlyPremium));
            }

            BaseMonthlyPremium = baseMonthlyPremium;
            RecalculatePremium();
        }
    }
}
