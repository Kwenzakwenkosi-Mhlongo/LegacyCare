using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace PolicyManagement.Models.ScheduleManagement
{
    public class BookingRestriction
    {
        [Key]
        public required string RestrictionId { get; set; } = "1";

        [Range(1, 100)]
        public required int MaxDailyBookings { get; set; }

        [Range(0, 365)]
        public required int MinAdvanceBookingDays { get; set; }

        [Required]
        public required TimeSpan EventStartTime { get; set; }

        [Required]
        public required TimeSpan EventEndTime { get; set; }

        [SetsRequiredMembers]
        public BookingRestriction()
        {
            RestrictionId = "1";
            MaxDailyBookings = 5;
            MinAdvanceBookingDays = 2;
            EventStartTime = new TimeSpan(8, 0, 0);
            EventEndTime = new TimeSpan(17, 0, 0);
        }

        public void UpdateRestrictions(
            int maxDailyBookings,
            int minAdvanceBookingDays,
            TimeSpan eventStartTime,
            TimeSpan eventEndTime)
        {
            if (maxDailyBookings <= 0)
                throw new ArgumentException(
                    "Maximum daily bookings must be greater than zero.");

            if (eventStartTime >= eventEndTime)
                throw new ArgumentException(
                    "Business start time must be before business end time.");

            MaxDailyBookings = maxDailyBookings;
            MinAdvanceBookingDays = minAdvanceBookingDays;
            EventStartTime = eventStartTime;
            EventEndTime = eventEndTime;
        }
    }
}