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

        // Foreign Key
        public required string UserId { get; set; }

        public string BranchId { get; set; } = 1.ToString();

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        //Display StaffID in form "ST + Number"
        [NotMapped]// Means "DO NOT CREATE A DB COLUMN FOR THIS PROPERTY"
        public string DisplayStaffId {
            get
            {
                return int.TryParse(StaffId, out int id) 
                ?  $"ST{id:D3}"
                : StaffId ?? "";
            }
        }

        [ForeignKey(nameof(BranchId))]
        public Branch Branch { get; set; } = null!;
    }
}