using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class FuneralStaffDeployment
    {
        [Key]
        public int FuneralStaffDeploymentId { get; set; }

        [Required]
        public string FuneralRequestId { get; set; } = string.Empty;

        [ForeignKey(nameof(FuneralRequestId))]
        public virtual FuneralRequest? FuneralRequest { get; set; }

        [Required]
        public string StaffId { get; set; } = string.Empty;

        [ForeignKey(nameof(StaffId))]
        public virtual Staff? Staff { get; set; }

        [Required]
        public string DeployedByUserId { get; set; } = string.Empty;

        public DateTime DeployedDate { get; set; } = DateTime.UtcNow;
    }
}
