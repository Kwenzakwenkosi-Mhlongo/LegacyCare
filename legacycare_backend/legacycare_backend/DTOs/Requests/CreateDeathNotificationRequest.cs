using Microsoft.AspNetCore.Http;

namespace PolicyManagement.DTOs.Requests
{
    public class CreateDeathNotificationRequest
    {
        public string PolicyId { get; set; } = string.Empty;

        public string BeneficiaryId { get; set; } = string.Empty;

        public DateTime DateOfDeath { get; set; }

        public string RelationshipToDeceased { get; set; } = string.Empty;

        public string ContactPerson { get; set; } = string.Empty;

        public string ContactNumber { get; set; } = string.Empty;

        public IFormFile? ProofOfDeathDocument { get; set; }
    }
}