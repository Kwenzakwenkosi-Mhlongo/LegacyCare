using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models.UserManagement
{
    public class Client
    {
        [Key]
        public string? ClientId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        // ============================================
        // CLIENT BRANCH
        // ============================================

        public string? BranchId { get; set; }

        [ForeignKey(nameof(BranchId))]
        public virtual Branch? Branch { get; set; }

        // ============================================
        // DISPLAY CLIENT ID
        // ============================================

        [NotMapped]
        public string DisplayClientId
        {
            get
            {
                return int.TryParse(ClientId, out int id)
                    ? $"CL{id:D3}"
                    : ClientId ?? "";
            }
        }

        public Client()
        {
        }
    }
}