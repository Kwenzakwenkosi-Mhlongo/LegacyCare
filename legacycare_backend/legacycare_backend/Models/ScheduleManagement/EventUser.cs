using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models.ScheduleManagement
{
    public class EventUser
    {
        public string EventId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(EventId))]
        public virtual Event? Event { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual UserManagement.User? User { get; set; }
    }
}