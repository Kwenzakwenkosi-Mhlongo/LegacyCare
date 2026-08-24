using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class RejectDeathNotificationRequest
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }
}