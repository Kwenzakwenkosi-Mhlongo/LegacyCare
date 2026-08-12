using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models.UserManagement
{
    public class Client
    {
        [Key]
        public string? ClientId { get; set; } = string.Empty;

        public required string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        //Display ClentID in form "CL + Number"
        [NotMapped]// Means "DO NOT CREATE A DB COLUMN FOR THIS PROPERTY"
        public string DisplayClientId {
            get
            {
                return int.TryParse(ClientId, out int id) 
                ?  $"CL{id:D3}"
                : ClientId ?? "";
            }
        }
        public Client(){}
    }
}