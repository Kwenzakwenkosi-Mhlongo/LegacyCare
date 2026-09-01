public class AssignStorageRequest
{
    public required string AssignmentId { get; set; }
    public required string StorageId { get; set; }
    public required string DeceasedId { get; set; }
    public DateTime DateAssigned { get; set; }
}