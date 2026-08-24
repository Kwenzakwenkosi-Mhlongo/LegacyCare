using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class DeceasedStorage
    {
        [Key]
        public string AssignmentId { get; set; }

        [Required]
        public string StorageId { get; set; } = string.Empty;

        [Required]
        public string DeceasedId { get; set; } = string.Empty;

        [Required]
        public DateTime DateAssigned { get; set; }

        public DateTime? DateRemoved { get; set; }

        [ForeignKey(nameof(StorageId))]
        public virtual Storage Storage { get; set; } = null!;

        [ForeignKey(nameof(DeceasedId))]
        public virtual Deceased Deceased { get; set; } = null!;

        public DeceasedStorage()
        {
            AssignmentId = Guid.NewGuid().ToString();
            DateAssigned = DateTime.UtcNow;
            DateRemoved = null;
        }

        public void Release()
        {
            if (DateRemoved.HasValue)
                throw new InvalidOperationException("This assignment has already been released.");

            DateRemoved = DateTime.UtcNow;
        }
    }
}