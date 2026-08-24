namespace PolicyManagement.DTOs.Requests
{
    public class CreateServiceRequestDto
    {
        public string RequestType { get; set; } =
            string.Empty;

        public string? Description { get; set; }

        public string? BranchId { get; set; }

        public string? Priority { get; set; }

        public bool AcceptPriorityFee { get; set; }

        public DateTime? AppointmentDateTime { get; set; }
    }
}