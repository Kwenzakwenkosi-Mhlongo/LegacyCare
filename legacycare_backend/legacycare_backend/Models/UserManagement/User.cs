// File:
// legacycare_backend/legacycare_backend/Models/UserManagement/User.cs

using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using PolicyManagement.Enums;

namespace PolicyManagement.Models.UserManagement
{
    public class User
    {
        [Key]
        public string UserId { get; set; }

        [StringLength(50)]
        public required string FullName { get; set; } = string.Empty;

        [EmailAddress]
        public required string Email { get; set; } = string.Empty;

        public required string PasswordHash { get; set; } = string.Empty;

        public UserRole Role { get; set; }

        public required string IDNumber { get; set; } = string.Empty;

        public required string CellNo { get; set; } = string.Empty;

        public required string Address { get; set; } = string.Empty;

        public DateTime DateCreated { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? LastLogin { get; set; }

        public string? PasswordSetupToken { get; set; }

        public DateTime? PasswordSetupTokenExpiry { get; set; }

        public string? ProfilePictureBlobName { get; set; }

        public User()
        {
            UserId = Guid.NewGuid().ToString();
            DateCreated = DateTime.Now;
            IsActive = true;
        }

        [SetsRequiredMembers]
        public User(
            string fullName,
            string idNumber,
            string email,
            string passwordHash,
            UserRole role,
            string cellNo,
            string address)
        {
            UserId = Guid.NewGuid().ToString();
            FullName = fullName;
            IDNumber = idNumber;
            Email = email;
            PasswordHash = passwordHash;
            Role = role;
            CellNo = cellNo;
            Address = address;
            DateCreated = DateTime.Now;
            IsActive = true;
        }

        public void UpdateDetails(
            string fullName,
            UserRole role,
            string cellNo,
            string address,
            string email)
        {
            if (string.IsNullOrWhiteSpace(fullName))
            {
                throw new ArgumentException(
                    "Full name cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException(
                    "Email cannot be empty.");
            }

            FullName = fullName;
            Role = role;
            CellNo = cellNo;
            Address = address;
            Email = email;
        }

        public void ChangePassword(string newPasswordHash)
        {
            if (string.IsNullOrWhiteSpace(newPasswordHash))
            {
                throw new ArgumentException(
                    "New password cannot be empty.");
            }

            PasswordHash = newPasswordHash;
        }

        public void DeactivateAccount()
        {
            IsActive = false;
        }

        public void ActivateAccount()
        {
            IsActive = true;
        }
    }
}