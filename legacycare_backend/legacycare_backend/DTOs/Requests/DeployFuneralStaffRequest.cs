
using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class DeployFuneralStaffRequest
    {
        [Required]
        [MinLength(4)]
        [MaxLength(4)]
        public List<string> StaffIds { get; set; } = [];
    }
}
