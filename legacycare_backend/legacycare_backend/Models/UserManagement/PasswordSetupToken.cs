using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.Models.UserManagement
{
    public class PasswordSetupToken
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = string.Empty;

        public string Token { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public bool Used { get; set; } = false;
    }
}