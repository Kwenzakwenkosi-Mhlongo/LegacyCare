using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Models
{
    public class Branch
    {
        // =====================================================
        // PRIMARY KEY
        // =====================================================

        [Key]
        public string BranchId { get; set; } = string.Empty;

        // =====================================================
        // BRANCH INFORMATION
        // =====================================================

        [Required]
        public string BranchName { get; set; } = string.Empty;

        [Required]
        public string ContactNo { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        // =====================================================
        // STAFF
        // =====================================================

        [JsonIgnore]
        public ICollection<Staff> StaffMembers { get; set; }
            = new List<Staff>();

        // =====================================================
        // DEATH NOTIFICATIONS
        // =====================================================

        [JsonIgnore]
        public ICollection<DeathNotification> DeathNotifications { get; set; }
            = new List<DeathNotification>();

        // =====================================================
        // SERVICE REQUESTS
        // =====================================================

        [JsonIgnore]
        public ICollection<ServiceRequest> ServiceRequests { get; set; }
            = new List<ServiceRequest>();

        // =====================================================
        // CONSTRUCTOR
        // =====================================================

        public Branch()
        {
            IsActive = true;
        }
    }
}