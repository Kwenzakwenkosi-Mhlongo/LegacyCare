using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.Models
{
    public class Role
    {
        [Key]
        public string RoleID { get; private set; } = string.Empty;
        public required string RoleName { get; set; } = string.Empty;
        public string? Description { get; private set; } = string.Empty;

        public Role()
        {
        }

        public Role(string roleName, string description)
        {
            RoleID = Guid.NewGuid().ToString();
            RoleName = roleName;
            Description = description;
        }
    }

}
