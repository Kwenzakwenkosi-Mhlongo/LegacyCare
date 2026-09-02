// File:
// legacycare_backend/legacycare_backend/Models/PackageItem.cs

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PolicyManagement.Models
{
    public class PackageItem
    {
        [Key]
        public string PackageItemId { get; set; } = string.Empty;

        [Required]
        public string CategoryId { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceValue { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyPremiumContribution { get; set; }

        [StringLength(500)]
        public string? ImageBlobName { get; set; }

        public bool IsActive { get; set; }

        public int DisplayOrder { get; set; }

        public DateTime DateCreated { get; set; }

        public DateTime? DateUpdated { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public virtual PackageItemCategory? Category { get; set; }

        public PackageItem()
        {
            PackageItemId = Guid.NewGuid().ToString();
            IsActive = true;
            DateCreated = DateTime.UtcNow;
        }

        public PackageItem(
            string categoryId,
            string name,
            string? description,
            decimal serviceValue,
            decimal monthlyPremiumContribution,
            string? imageBlobName = null,
            int displayOrder = 0)
        {
            PackageItemId = Guid.NewGuid().ToString();
            CategoryId = categoryId;
            Name = name;
            Description = description ?? string.Empty;
            ServiceValue = serviceValue;
            MonthlyPremiumContribution = monthlyPremiumContribution;
            ImageBlobName = imageBlobName;
            DisplayOrder = displayOrder;
            IsActive = true;
            DateCreated = DateTime.UtcNow;

            Validate();
        }

        public void UpdateDetails(
            string name,
            string? description,
            decimal serviceValue,
            decimal monthlyPremiumContribution,
            int displayOrder)
        {
            Name = name;
            Description = description ?? string.Empty;
            ServiceValue = serviceValue;
            MonthlyPremiumContribution = monthlyPremiumContribution;
            DisplayOrder = displayOrder;
            DateUpdated = DateTime.UtcNow;

            Validate();
        }

        public void SetImage(string? imageBlobName)
        {
            ImageBlobName = string.IsNullOrWhiteSpace(imageBlobName)
                ? null
                : imageBlobName;

            DateUpdated = DateTime.UtcNow;
        }

        public void Activate()
        {
            IsActive = true;
            DateUpdated = DateTime.UtcNow;
        }

        public void Deactivate()
        {
            IsActive = false;
            DateUpdated = DateTime.UtcNow;
        }

        private void Validate()
        {
            if (string.IsNullOrWhiteSpace(CategoryId))
            {
                throw new ArgumentException(
                    "Category ID is required.");
            }

            if (string.IsNullOrWhiteSpace(Name))
            {
                throw new ArgumentException(
                    "Package item name is required.");
            }

            if (ServiceValue <= 0)
            {
                throw new ArgumentException(
                    "Service value must be greater than zero.");
            }

            if (MonthlyPremiumContribution <= 0)
            {
                throw new ArgumentException(
                    "Monthly premium contribution must be greater than zero.");
            }
        }
    }
}