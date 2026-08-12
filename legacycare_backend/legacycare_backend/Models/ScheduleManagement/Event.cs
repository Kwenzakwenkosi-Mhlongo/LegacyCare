using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using PolicyManagement.Enums;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.ScheduleManagement
{
    public class Event
    {
        [Key]
        public required string EventId { get; set; } = string.Empty;

        [StringLength(100)]
        public required string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public required string Description { get; set; } = string.Empty;

        public required EventType EventType { get; set; }

        public required DateTime EventDate { get; set; }

        [StringLength(250)]
        public string? Venue { get; set; } = string.Empty;

        public string? ClientId { get; set; } = string.Empty;

        public virtual ICollection<EventUser> StaffMembers { get; set; }

        public string? DeceasedId { get; set; }

        public EventStatus Status { get; set; } = EventStatus.Scheduled;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(ClientId))]
        public virtual User? Client { get; set; }

        [ForeignKey(nameof(DeceasedId))]
        public virtual Deceased? Deceased { get; set; }

        [SetsRequiredMembers]
        public Event()
        {
            EventId = Guid.NewGuid().ToString();
            CreatedDate = DateTime.UtcNow;
            Status = EventStatus.Scheduled;
            StaffMembers = new List<EventUser>();
        }

        [SetsRequiredMembers]
        public Event(
            string title,
            string description,
            EventType eventType,
            DateTime eventDate,
            string? venue,
            string clientId)
        {
            EventId = Guid.NewGuid().ToString();
            Title = title;
            Description = description;
            EventType = eventType;
            EventDate = eventDate;
            Venue = venue;
            ClientId = clientId;
            CreatedDate = DateTime.UtcNow;
            Status = EventStatus.Scheduled;
            StaffMembers = new List<EventUser>();
        }

        public void AddStaff(User staff)
        {
            if (staff == null)
                throw new ArgumentNullException(nameof(staff));

            bool alreadyAssigned = StaffMembers.Any(s =>
                s.UserId == staff.UserId);

            if (alreadyAssigned)
                throw new InvalidOperationException(
                    "Staff member is already assigned to this event.");

            var eventUser = new EventUser
            {
                EventId = this.EventId,
                UserId = staff.UserId
            };

            StaffMembers.Add(eventUser);
        }

        public void RemoveStaff(string staffId)
        {
            var staff = StaffMembers
                .FirstOrDefault(s => s.UserId == staffId);

            if (staff == null)
                throw new KeyNotFoundException(
                    "Staff member is not assigned to this event.");

            StaffMembers.Remove(staff);
        }

        public void AssignDeceased(string deceasedId)
        {
            if (string.IsNullOrWhiteSpace(deceasedId))
                throw new ArgumentException("Deceased ID cannot be empty.");

            DeceasedId = deceasedId;
        }

        public void UpdateDetails(
            string title,
            string description,
            DateTime eventDate,
            string? venue)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title cannot be empty.");

            if (eventDate < DateTime.UtcNow)
                throw new ArgumentException("Event date cannot be in the past.");

            Title = title;
            Description = description;
            EventDate = eventDate;
            Venue = venue;
        }

        public void Reschedule(DateTime newDate)
        {
            if (newDate < DateTime.UtcNow)
                throw new ArgumentException("Event date cannot be in the past.");

            EventDate = newDate;
        }

        public void Complete()
        {
            Status = EventStatus.Completed;
        }

        public void Cancel()
        {
            Status = EventStatus.Cancelled;
        }

        public void Postpone()
        {
            Status = EventStatus.Postponed;
        }
    }
}