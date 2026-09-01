// ============================================================================
// File: DTOs/Requests/CreateBeneficiaryRequestRequest.cs
// ============================================================================

using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    /// <summary>
    /// Contains only client-editable fields for a beneficiary change request.
    /// Server-owned fields such as UserId, RequestId, Status and RequestDate
    /// are intentionally excluded.
    /// </summary>
    public class CreateBeneficiaryRequestRequest
    {
        public string PolicyId { get; set; } = string.Empty;

        public RequestType RequestType { get; set; }

        public string? Description { get; set; }

        public string? BeneficiaryId { get; set; }

        public string? FullName { get; set; }

        public BeneficiaryRelationship Relationship { get; set; }

        public string? IDNumber { get; set; }

        public DateTime DateOfBirth { get; set; }

        public string? Gender { get; set; }
    }
}