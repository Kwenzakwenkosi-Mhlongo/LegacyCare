// File:
// legacycare_backend/legacycare_backend/Models/PackageItemCategory.cs

using System.ComponentModel.DataAnnotations;
using PolicyManagement.Enums;

namespace PolicyManagement.Models
{
    public class PackageItemCategory
    {
        [Key]
        public string CategoryId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        public PackageItemSelectionMode SelectionMode { get; set; }

        public int MinimumSelections { get; set; }

        public int MaximumSelections { get; set; }

        public int MinimumActiveChoices { get; set; }

        public bool IsActive { get; set; }

        public int DisplayOrder { get; set; }

        public DateTime DateCreated { get; set; }

        public virtual ICollection<PackageItem> Items { get; set; }
            = new List<PackageItem>();

        public PackageItemCategory()
        {
            CategoryId = Guid.NewGuid().ToString();
            SelectionMode = PackageItemSelectionMode.OptionalSingle;
            MinimumSelections = 0;
            MaximumSelections = 1;
            MinimumActiveChoices = 10;
            IsActive = true;
            DateCreated = DateTime.UtcNow;
        }

        public PackageItemCategory(
            string name,
            string? description,
            PackageItemSelectionMode selectionMode,
            int minimumSelections,
            int maximumSelections,
            int displayOrder = 0)
        {
            CategoryId = Guid.NewGuid().ToString();
            Name = name;
            Description = description ?? string.Empty;
            SelectionMode = selectionMode;
            MinimumSelections = minimumSelections;
            MaximumSelections = maximumSelections;
            MinimumActiveChoices = 10;
            DisplayOrder = displayOrder;
            IsActive = true;
            DateCreated = DateTime.UtcNow;

            Validate();
        }

        public void UpdateDetails(
            string name,
            string? description,
            PackageItemSelectionMode selectionMode,
            int minimumSelections,
            int maximumSelections,
            int displayOrder)
        {
            Name = name;
            Description = description ?? string.Empty;
            SelectionMode = selectionMode;
            MinimumSelections = minimumSelections;
            MaximumSelections = maximumSelections;
            DisplayOrder = displayOrder;

            Validate();
        }

        public bool IsAvailableForClients()
        {
            if (!IsActive)
            {
                return false;
            }

            var activeChoices =
                Items.Count(item => item.IsActive);

            return activeChoices >= MinimumActiveChoices;
        }

        public void Activate()
        {
            IsActive = true;
        }

        public void Deactivate()
        {
            IsActive = false;
        }

        private void Validate()
        {
            if (string.IsNullOrWhiteSpace(Name))
            {
                throw new ArgumentException(
                    "Category name is required.");
            }

            if (MinimumSelections < 0)
            {
                throw new ArgumentException(
                    "Minimum selections cannot be negative.");
            }

            if (MaximumSelections < 1)
            {
                throw new ArgumentException(
                    "Maximum selections must be at least 1.");
            }

            if (MinimumSelections > MaximumSelections)
            {
                throw new ArgumentException(
                    "Minimum selections cannot exceed maximum selections.");
            }

            if (
                SelectionMode ==
                    PackageItemSelectionMode.RequiredSingle &&
                (MinimumSelections != 1 ||
                 MaximumSelections != 1))
            {
                throw new ArgumentException(
                    "RequiredSingle categories must require exactly one selection.");
            }

            if (
                SelectionMode ==
                    PackageItemSelectionMode.OptionalSingle &&
                (MinimumSelections != 0 ||
                 MaximumSelections != 1))
            {
                throw new ArgumentException(
                    "OptionalSingle categories must allow zero or one selection.");
            }

            if (
                SelectionMode ==
                    PackageItemSelectionMode.RequiredMultiple &&
                MinimumSelections < 1)
            {
                throw new ArgumentException(
                    "RequiredMultiple categories must require at least one selection.");
            }
        }
    }
}