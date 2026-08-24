namespace PolicyManagement.DTOs.Requests
{
    public class UpdateAppointmentDto
    {
        public string AppointmentType { get; set; } = string.Empty;

        public string Date { get; set; } = string.Empty;

        public string Time { get; set; } = string.Empty;

       public string? BranchId { get; set; }

        public string? Description { get; set; }

        public string Priority { get; set; } = "Normal";

        public bool AcceptPriorityFee { get; set; }
    }
}