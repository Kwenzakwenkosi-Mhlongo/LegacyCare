using System.ComponentModel.DataAnnotations;
using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class CreateBeneficiaryRequest
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string IDNumber { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;

        [Required]
        public BeneficiaryRelationship Relationship { get; set; }
    }
}