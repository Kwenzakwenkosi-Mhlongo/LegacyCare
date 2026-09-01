// File: Models/ScheduleManagement/AppointmentStatus.cs

namespace PolicyManagement.Models.ScheduleManagement
{
    public static class AppointmentStatus
    {
        public const string Requested = "Requested";

        public const string Confirmed = "Confirmed";

        public const string Rescheduled = "Rescheduled";

        public const string Completed = "Completed";

        public const string Cancelled = "Cancelled";

        public const string NoShow = "NoShow";

        public static readonly IReadOnlySet<string> All =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                Requested,
                Confirmed,
                Rescheduled,
                Completed,
                Cancelled,
                NoShow
            };

        public static bool IsValid(
            string? status)
        {
            return !string.IsNullOrWhiteSpace(status)
                && All.Contains(status.Trim());
        }

        public static bool IsClosed(
            string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return false;
            }

            return
                status.Equals(
                    Completed,
                    StringComparison.OrdinalIgnoreCase) ||
                status.Equals(
                    Cancelled,
                    StringComparison.OrdinalIgnoreCase) ||
                status.Equals(
                    NoShow,
                    StringComparison.OrdinalIgnoreCase);
        }
    }
}