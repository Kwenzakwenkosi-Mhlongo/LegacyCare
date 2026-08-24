namespace PolicyManagement.DTOs.Requests
{
    public class UpdateServiceRequestDto
    {
        public string? BranchId { get; set; }

        public string? Description { get; set; }

        public DateTime? AppointmentDateTime { get; set; }
    }
}