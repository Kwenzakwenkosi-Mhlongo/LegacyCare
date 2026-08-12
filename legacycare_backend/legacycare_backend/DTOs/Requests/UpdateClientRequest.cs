namespace PolicyManagement.DTOs.Requests
{
    public class UpdateClientRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string IdNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CellNo { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public bool IsActive {get; set; }
    }
}