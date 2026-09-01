// ============================================================================
// FILE: Models/MortuaryManagement/BodyLocationTypes.cs
// ============================================================================

namespace PolicyManagement.Models.MortuaryManagement
{
    public static class BodyLocationTypes
    {
        public const string HomeScene = "HomeScene";
        public const string Hospital = "Hospital";
        public const string GovernmentMortuary = "GovernmentMortuary";
        public const string LegacyCareMortuary = "LegacyCareMortuary";
        public const string Other = "Other";

        public static readonly IReadOnlyCollection<string> All =
            new[]
            {
                HomeScene,
                Hospital,
                GovernmentMortuary,
                LegacyCareMortuary,
                Other
            };

        public static string Normalize(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException(
                    "Body location type is required.",
                    nameof(value));
            }

            var trimmedValue = value.Trim();

            var exactMatch = All.FirstOrDefault(
                location =>
                    location.Equals(
                        trimmedValue,
                        StringComparison.OrdinalIgnoreCase));

            if (exactMatch != null)
            {
                return exactMatch;
            }

            // Backward compatibility for older frontend/database values.
            if (trimmedValue.Equals(
                "Home",
                StringComparison.OrdinalIgnoreCase))
            {
                return HomeScene;
            }

            if (trimmedValue.Equals(
                "Mortuary",
                StringComparison.OrdinalIgnoreCase))
            {
                return GovernmentMortuary;
            }

            throw new ArgumentException(
                $"Invalid body location type '{value}'. " +
                $"Allowed values are: {string.Join(", ", All)}.",
                nameof(value));
        }
    }
}