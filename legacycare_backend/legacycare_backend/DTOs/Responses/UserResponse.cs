using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Responses
{
    public class UserResponse
    {
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string IDNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string CellNo { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public DateTime? LastLogin { get; set; }
        public bool IsActive { get; set; }
    }
}