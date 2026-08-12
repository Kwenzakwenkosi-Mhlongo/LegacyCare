namespace PolicyManagement.DTOs.Responses
{
    public class PackageResponse
    {
        public string PackageId { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public double MonthlyPremium { get; set; }

        public string Description { get; set; } = string.Empty;

        public int MaxBeneficiaries { get; set; }
    }
}