using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace PolicyManagement.Models.MortuaryManagement
{
    public class Deceased
    {
        [Key]
        public required string DeceasedId { get; set; }

        [Required]
        public required string FullName { get; set; }

        [Required]
        public required string IDNumber { get; set; }

        [Required]
        public required DateTime DateOfBirth { get; set; }

        [Required]
        public required DateTime DateOfDeath { get; set; }

        [Required]
        public required string Gender { get; set; }

        public string? CauseOfDeath { get; set; }

        [Required]
        public required string PolicyId { get; set; }

        [Required]
        public bool IsReleased { get; private set; }

        [SetsRequiredMembers]
        public Deceased()
        {
            DeceasedId = Guid.NewGuid().ToString();
            IsReleased = false;
        }

        [SetsRequiredMembers]
        public Deceased(
            string fullName,
            string idNumber,
            DateTime dateOfBirth,
            DateTime dateOfDeath,
            string gender,
            string policyId,
            string? causeOfDeath)
        {
            DeceasedId = Guid.NewGuid().ToString();

            FullName = fullName;
            IDNumber = idNumber;
            DateOfBirth = dateOfBirth;
            DateOfDeath = dateOfDeath;
            Gender = gender;
            PolicyId = policyId;
            CauseOfDeath = causeOfDeath;

            IsReleased = false;
        }

        public void UpdateDetails(string fullName,string gender,string? causeOfDeath)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new ArgumentException("Full name is required.");

            FullName = fullName;
            Gender = gender;
            CauseOfDeath = causeOfDeath;
        }

        public void Release()
        {
            if (IsReleased)
                throw new InvalidOperationException(
                    "Deceased has already been released.");

            IsReleased = true;
        }
    }
}