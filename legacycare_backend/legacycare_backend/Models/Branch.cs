using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models
{
    
    public class Branch
    {
        [Key]
        public string BranchId { get; set; }

        public required string BranchName { get; set; } = string.Empty;

        public required string ContactNo { get; set; } = string.Empty;
        public required string Email { get; set; } = string.Empty;
        public required string Address { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<Staff> StaffMembers { get; set; }
        = new List<Staff>();


        public Branch()
        {
            this.BranchId = Guid.NewGuid().ToString();
        }
        
    }
}