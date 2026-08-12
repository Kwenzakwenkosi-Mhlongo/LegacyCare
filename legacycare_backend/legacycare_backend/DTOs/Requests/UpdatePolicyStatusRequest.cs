using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class UpdatePolicyStatusRequest
    {
        public PolicyStatus Status { get; set; }
    }
}