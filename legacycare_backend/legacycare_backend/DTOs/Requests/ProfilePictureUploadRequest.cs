using Microsoft.AspNetCore.Http;

namespace PolicyManagement.DTOs.Requests
{
    public class ProfilePictureUploadRequest
    {
        public required IFormFile File { get; set; }
    }
}
