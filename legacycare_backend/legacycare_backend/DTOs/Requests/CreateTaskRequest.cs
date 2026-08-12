namespace PolicyManagement.DTOs.Requests
{
    public class CreateTaskRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public string AssignedToId { get; set; } = string.Empty;
        public string? DeceasedId { get; set; }
        public string? EventId { get; set; }
    }
}