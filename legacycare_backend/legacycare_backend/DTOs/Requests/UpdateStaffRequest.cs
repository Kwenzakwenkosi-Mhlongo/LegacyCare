using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class UpdateStaffRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CellNo { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public StaffType StaffRole {get; set; }
        public string BranchId { get; set; } = string.Empty;
        public bool IsActive {get; set; }
    }
}