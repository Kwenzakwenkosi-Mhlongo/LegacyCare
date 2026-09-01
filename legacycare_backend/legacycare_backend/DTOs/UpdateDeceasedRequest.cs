namespace PolicyManagement.DTOs.Requests
{
    public class UpdateDeceasedRequest
    {
        public required string FullName { get; set; }
        public required string Gender { get; set; }
        public required string CauseOfDeath { get; set; }
    }
}