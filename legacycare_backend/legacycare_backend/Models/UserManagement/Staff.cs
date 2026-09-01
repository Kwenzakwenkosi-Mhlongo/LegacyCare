
// ============================================================
// FILE: Models/UserManagement/Staff.cs
// ============================================================

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;

namespace PolicyManagement.Models.UserManagement
{
    public class Staff
    {
        [Key]
        public string StaffId { get; set; } = string.Empty;

        [Required]
        public StaffType StaffRole { get; set; }

        [Required]
        public DateTime HireDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Salary { get; set; }

        public bool IsCovered { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string BranchId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [ForeignKey(nameof(BranchId))]
        public Branch Branch { get; set; } = null!;

        [NotMapped]
        public string DisplayStaffId
        {
            get
            {
                return int.TryParse(
                    StaffId,
                    out var id)
                    ? $"ST{id:D3}"
                    : StaffId;
            }
        }
    }
}
