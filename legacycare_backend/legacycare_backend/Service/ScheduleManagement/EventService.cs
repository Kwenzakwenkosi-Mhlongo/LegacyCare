using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Services.ScheduleManagement;

namespace PolicyManagement.Service.ScheduleManagement
{
    public class EventService : IEventService
    {
        private readonly AppDbContext _context;

        public EventService(AppDbContext context)
        {
            _context = context;
        }

        public Event CreateEvent(Event newEvent)
        {
            bool clientExists = _context.Users
                .Any(u => u.UserId == newEvent.ClientId);

            if (!clientExists)
                throw new KeyNotFoundException("Client not found.");

            _context.Event.Add(newEvent);
            _context.SaveChanges();

            return newEvent;
        }

        public Event GetEventById(string eventId)
        {
            var eventItem = _context.Event
                .Include(e => e.Client)
                .Include(e => e.StaffMembers)
                    .ThenInclude(es => es.User)
                .Include(e => e.Deceased)
                .FirstOrDefault(e => e.EventId == eventId);

            if (eventItem == null)
                throw new KeyNotFoundException("Event not found.");

            return eventItem;
        }

        public IEnumerable<Event> GetAllEvents()
        {
            return _context.Event
                .Include(e => e.Client)
                .Include(e => e.StaffMembers)
                    .ThenInclude(es => es.User)
                .Include(e => e.Deceased)
                .ToList();
        }

        public IEnumerable<Event> GetEventsByClient(string clientId)
        {
            return _context.Event
                .Include(e => e.Client)
                .Include(e => e.StaffMembers)
                    .ThenInclude(es => es.User)
                .Include(e => e.Deceased)
                .Where(e => e.ClientId == clientId)
                .ToList();
        }

        public IEnumerable<Event> GetEventsByDate(DateTime date)
        {
            var start = date.Date;
            var end = start.AddDays(1);

            return _context.Event
                .Include(e => e.Client)
                .Include(e => e.StaffMembers)
                    .ThenInclude(es => es.User)
                .Include(e => e.Deceased)
                .Where(e => e.EventDate >= start && e.EventDate < end)
                .ToList();
        }

        public IEnumerable<Event> GetEventsByStaff(string staffId)
        {
            var eventIds = _context.EventUser
                .Where(eu => eu.UserId == staffId)
                .Select(eu => eu.EventId)
                .ToList();

            return _context.Event
                .Include(e => e.Client)
                .Include(e => e.StaffMembers)
                    .ThenInclude(es => es.User)
                .Include(e => e.Deceased)
                .Where(e => eventIds.Contains(e.EventId))
                .ToList();
        }

        public void AddStaff(string eventId, string staffId)
        {
            var eventItem = GetEventById(eventId);

            var staff = _context.Users
                .FirstOrDefault(u => u.UserId == staffId);

            if (staff == null)
                throw new KeyNotFoundException("Staff member not found.");

            eventItem.AddStaff(staff);
            _context.SaveChanges();
        }

        public void RemoveStaff(string eventId, string staffId)
        {
            var eventItem = GetEventById(eventId);
            eventItem.RemoveStaff(staffId);
            _context.SaveChanges();
        }

        public void AssignDeceased(string eventId, string deceasedId)
        {
            var eventItem = GetEventById(eventId);

            bool deceasedExists = _context.Deceased
                .Any(d => d.DeceasedId == deceasedId);

            if (!deceasedExists)
                throw new KeyNotFoundException("Deceased not found.");

            eventItem.AssignDeceased(deceasedId);
            _context.SaveChanges();
        }

        public Event UpdateEvent(string eventId, Event updatedEvent)
        {
            var eventItem = GetEventById(eventId);

            eventItem.UpdateDetails(
                updatedEvent.Title,
                updatedEvent.Description,
                updatedEvent.EventDate,
                updatedEvent.Venue);

            _context.SaveChanges();

            return eventItem;
        }

        public void CompleteEvent(string eventId)
        {
            var eventItem = GetEventById(eventId);
            eventItem.Complete();
            _context.SaveChanges();
        }

        public void PostponeEvent(string eventId)
        {
            var eventItem = GetEventById(eventId);
            eventItem.Postpone();
            _context.SaveChanges();
        }

        public void CancelEvent(string eventId)
        {
            var eventItem = GetEventById(eventId);
            eventItem.Cancel();
            _context.SaveChanges();
        }

        public void DeleteEvent(string eventId)
        {
            var eventItem = GetEventById(eventId);
            _context.Event.Remove(eventItem);
            _context.SaveChanges();
        }

        public IEnumerable<Event> SearchEvents(string keyword)
        {
            keyword = keyword.ToLower();

            return _context.Event
                .Include(e => e.Client)
                .Include(e => e.StaffMembers)
                    .ThenInclude(es => es.User)
                .Include(e => e.Deceased)
                .Where(e =>
                    e.Title.ToLower().Contains(keyword) ||
                    e.Description.ToLower().Contains(keyword) ||
                    e.Venue.ToLower().Contains(keyword))
                .ToList();
        }
    }
}