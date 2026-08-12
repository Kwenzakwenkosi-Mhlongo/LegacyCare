using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class CreateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string IDNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public UserRole Role { get; set; } 
        public string CellNo { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }
}