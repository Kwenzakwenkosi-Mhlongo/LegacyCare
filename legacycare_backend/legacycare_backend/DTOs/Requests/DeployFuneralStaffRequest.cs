using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class DeployFuneralStaffRequest
    {
        [Required]
        public List<string> StaffIds { get; set; } = new();
    }
}