using PolicyManagement.Models.ScheduleManagement;

namespace PolicyManagement.Service.ScheduleManagement
{
    public interface IBookingRestrictionService
    {
        BookingRestriction GetRestrictions();

        BookingRestriction UpdateRestrictions(BookingRestriction restrictions);
    }
}