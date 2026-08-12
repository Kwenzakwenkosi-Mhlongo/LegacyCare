using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class Storage
    {
        [Key]
        public required string StorageId { get; set; }

        [Required]
        public required string UnitNumber { get; set; }

        [Required]
        public required string BranchId { get; set; }

        [Required]
        public bool IsAvailable { get; set; }

        [SetsRequiredMembers]
        public Storage()
        {
            StorageId = Guid.NewGuid().ToString();
            IsAvailable = true;
        }

        [SetsRequiredMembers]
        public Storage(string unitNumber, string branchId)
        {
            StorageId = Guid.NewGuid().ToString();
            UnitNumber = unitNumber;
            BranchId = branchId;
            IsAvailable = true;
        }

        public void MarkAvailable()
        {
            IsAvailable = true;
        }

        public void MarkUnavailable()
        {
            IsAvailable = false;
        }

        public void UpdateUnitNumber(string unitNumber)
        {
            if (string.IsNullOrWhiteSpace(unitNumber))
                throw new ArgumentException("Unit number is required.");

            UnitNumber = unitNumber;
        }
    }
}