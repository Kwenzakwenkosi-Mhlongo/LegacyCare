// ============================================================================
// FILE: DTOs/Requests/CreateDeathNotificationRequest.cs
// ============================================================================

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace PolicyManagement.DTOs.Requests
{
    public class CreateDeathNotificationRequest
    {
        [Required]
        public string PolicyId { get; set; } = string.Empty;

        [Required]
        public string BeneficiaryId { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfDeath { get; set; }

        [Required]
        [MaxLength(100)]
        public string RelationshipToDeceased { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string ContactPerson { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string ContactNumber { get; set; } = string.Empty;

        [Required]
        public IFormFile? ProofOfDeathDocument { get; set; }

        [Required]
        [MaxLength(50)]
        public string BodyLocationType { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? BodyLocationAddress { get; set; }

        [MaxLength(200)]
        public string? MortuaryName { get; set; }

        public DateTime? CollectionDate { get; set; }

        [MaxLength(1000)]
        public string? CollectionNotes { get; set; }
    }
}