// ============================================================================
// FILE: DTOs/Requests/UpdateBodyLocationRequest.cs
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class UpdateBodyLocationRequest
    {
        [Required]
        [MaxLength(50)]
        public string BodyLocationType { get; set; } =
            string.Empty;

        [MaxLength(500)]
        public string? BodyLocationAddress { get; set; }

        [MaxLength(200)]
        public string? MortuaryName { get; set; }

        // Database identifier selected from available-storage-units.
        public string? StorageId { get; set; }

        public DateTime? CollectionDate { get; set; }

        [MaxLength(1000)]
        public string? CollectionNotes { get; set; }
    }
}

