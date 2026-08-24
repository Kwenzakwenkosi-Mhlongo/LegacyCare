namespace PolicyManagement.DTOs.Requests
{
    public class CreateServiceRequestRequest
    {
        public string? RequestType { get; set; }

        public string? Priority { get; set; }

        public bool AcceptPriorityFee { get; set; }

        public decimal AdditionalFee { get; set; }

        public string? BranchId { get; set; }

        public DateTime? AppointmentDateTime { get; set; }

        public string? Description { get; set; }
    }
}