using System.ComponentModel.DataAnnotations;

namespace PolicyManagement.DTOs.Requests
{
    public class SetPasswordRequest
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
    }
}