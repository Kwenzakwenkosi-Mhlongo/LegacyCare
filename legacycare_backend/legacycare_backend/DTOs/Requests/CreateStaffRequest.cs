using PolicyManagement.Enums;

public class CreateStaffRequest
{
    // User Details
    public required string FullName { get; set; }
    public required string IDNumber { get; set; }
    public required string Email { get; set; }
    public UserRole Role { get; set; }
    public required string CellNo { get; set; }
    public required string Address { get; set; }

    // Staff Details
    public StaffType StaffRole { get; set; }
    public string BranchId { get; set; } = string.Empty;
    public DateTime HireDate { get; set; }
    public decimal Salary { get; set; }
    public bool IsCovered { get; set; }
}