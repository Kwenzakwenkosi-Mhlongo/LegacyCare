using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class CreateFuneralRequestRequest
    {
        [Required]
        public string DeathNotificationId { get; set; } =
            string.Empty;

        [Required]
        public DateTime FuneralDate { get; set; }

        [Required]
        public TimeSpan FuneralTime { get; set; }

        [Required]
        [MaxLength(500)]
        public string Venue { get; set; } =
            string.Empty;

        [MaxLength(100)]
        public string? FuneralType { get; set; }

        public string? Notes { get; set; }
    }
}