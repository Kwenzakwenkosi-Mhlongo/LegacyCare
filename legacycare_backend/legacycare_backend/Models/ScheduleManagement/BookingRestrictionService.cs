using PolicyManagement.Data;
using PolicyManagement.Models.ScheduleManagement;

namespace PolicyManagement.Service.ScheduleManagement
{
    public class BookingRestrictionService : IBookingRestrictionService
    {
        private readonly AppDbContext _context;

        public BookingRestrictionService(AppDbContext context)
        {
            _context = context;
        }

        public BookingRestriction GetRestrictions()
        {
            var restrictions = _context.BookingRestriction
                .FirstOrDefault();

            if (restrictions == null)
            {
                restrictions = new BookingRestriction();
                _context.BookingRestriction.Add(restrictions);
                _context.SaveChanges();
            }

            return restrictions;
        }

        public BookingRestriction UpdateRestrictions(BookingRestriction updated)
        {
            var restrictions = GetRestrictions();

            restrictions.UpdateRestrictions(
                updated.MaxDailyBookings,
                updated.MinAdvanceBookingDays,
                updated.EventStartTime,
                updated.EventEndTime);

            _context.SaveChanges();

            return restrictions;
        }
    }
}