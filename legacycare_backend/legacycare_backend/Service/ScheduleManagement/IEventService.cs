using PolicyManagement.Models.ScheduleManagement;

namespace PolicyManagement.Services.ScheduleManagement
{
    public interface IEventService
    {
        IEnumerable<Event> GetAllEvents();

        Event GetEventById(string eventId);

        IEnumerable<Event> GetEventsByClient(string clientId);

        IEnumerable<Event> GetEventsByDate(DateTime date);

        IEnumerable<Event> GetEventsByStaff(string staffId);

        Event CreateEvent(Event newEvent);

        Event UpdateEvent(string eventId, Event updatedEvent);

        void DeleteEvent(string eventId);

        void AddStaff(string eventId, string staffId);

        void RemoveStaff(string eventId, string staffId);

        void AssignDeceased(string eventId, string deceasedId);

        void CompleteEvent(string eventId);

        void CancelEvent(string eventId);

        void PostponeEvent(string eventId);

        IEnumerable<Event> SearchEvents(string keyword);
    }
}