using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.Models
{
    public class Package
    {
        [Key]
        public string PackageId { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public double MonthlyPremium { get; set; }

        public string Description { get; set; } = string.Empty;

        public int MaxBeneficiaries { get; set; }

        public Package()
        {
            PackageId = Guid.NewGuid().ToString();
        }

        public Package(string name, double premium, string description, int maxBeneficiaries)
        {
            PackageId = Guid.NewGuid().ToString();
            Name = name;
            MonthlyPremium = premium;
            Description = description;
            MaxBeneficiaries = maxBeneficiaries;
        }

        public void UpdatePackage(string packageName, double monthlyPremium, string? description)
        {
            if (string.IsNullOrWhiteSpace(packageName))
                throw new ArgumentException("Package name is required.");

            Name = packageName;
            SetMonthlyPrice(monthlyPremium);
            Description = description ?? string.Empty;
        }

        public void SetMonthlyPrice(double premium)
        {
            if (premium <= 0)
                throw new ArgumentException("Monthly price must be greater than zero.");

            MonthlyPremium = premium;
        }
    }
}