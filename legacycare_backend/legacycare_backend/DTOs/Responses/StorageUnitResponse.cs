public class StorageUnitResponse
{
    public required string StorageId { get; set; }

    public required string UnitNumber { get; set; }

    public required string BranchId { get; set; }

    public bool IsAvailable { get; set; }

    public string? AssignmentId { get; set; }

    public string? DeceasedId { get; set; }

    public string? DeceasedName { get; set; }

    public DateTime? DateAssigned { get; set; }
}