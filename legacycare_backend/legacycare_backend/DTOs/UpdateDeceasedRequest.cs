namespace PolicyManagement.DTOs.Requests
{
    public class UpdateDeceasedRequest
    {
        public string FullName { get; set; }
        public string Gender { get; set; }
        public string CauseOfDeath { get; set; }
    }
}