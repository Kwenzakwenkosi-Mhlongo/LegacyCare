
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Enums;
using PolicyManagement.Models;

namespace PolicyManagement.Data
{
    public static class PackageCatalogSeeder
    {
        public static async Task SeedAsync(
            AppDbContext context)
        {
            var categories = new[]
            {
                new
                {
                    Name = "Coffins & Caskets",
                    Description = "Coffin and casket options available for funeral arrangements.",
                    Mode = PackageItemSelectionMode.OptionalSingle,
                    Min = 0,
                    Max = 1,
                    Order = 1
                },

                new
                {
                    Name = "Funeral Transportation",
                    Description = "Transportation services for the deceased and family members.",
                    Mode = PackageItemSelectionMode.OptionalMultiple,
                    Min = 0,
                    Max = 3,
                    Order = 2
                },

                new
                {
                    Name = "Funeral Service",
                    Description = "Funeral service packages providing different levels of funeral support.",
                    Mode = PackageItemSelectionMode.RequiredSingle,
                    Min = 1,
                    Max = 1,
                    Order = 3
                },

                new
                {
                    Name = "Floral Arrangements",
                    Description = "Floral arrangements and tributes for funeral services.",
                    Mode = PackageItemSelectionMode.OptionalMultiple,
                    Min = 0,
                    Max = 3,
                    Order = 4
                },

                new
                {
                    Name = "Memorial & Stationery",
                    Description = "Memorial materials and stationery for funeral services.",
                    Mode = PackageItemSelectionMode.OptionalMultiple,
                    Min = 0,
                    Max = 4,
                    Order = 5
                },

                new
                {
                    Name = "Catering & Refreshments",
                    Description = "Catering and refreshment options for funeral gatherings.",
                    Mode = PackageItemSelectionMode.OptionalMultiple,
                    Min = 0,
                    Max = 3,
                    Order = 6
                }
            };

            foreach (var categoryData in categories)
            {
                var category =
                    await context.PackageItemCategories
                        .FirstOrDefaultAsync(
                            c => c.Name == categoryData.Name);

                if (category == null)
                {
                    category = new PackageItemCategory(
                        categoryData.Name,
                        categoryData.Description,
                        categoryData.Mode,
                        categoryData.Min,
                        categoryData.Max,
                        categoryData.Order);

                    context.PackageItemCategories.Add(category);

                    await context.SaveChangesAsync();
                }
                else
                {
                    category.Description =
                        categoryData.Description;

                    category.SelectionMode =
                        categoryData.Mode;

                    category.MinimumSelections =
                        categoryData.Min;

                    category.MaximumSelections =
                        categoryData.Max;

                    category.DisplayOrder =
                        categoryData.Order;

                    category.IsActive = true;

                    await context.SaveChangesAsync();
                }

                await SeedItemsAsync(
                    context,
                    category);
            }
        }

        private static async Task SeedItemsAsync(
            AppDbContext context,
            PackageItemCategory category)
        {
            var items = GetItemsForCategory(
                category.Name);

            var displayOrder = 1;

            foreach (var itemData in items)
            {
                var existingItem =
                    await context.PackageItems
                        .FirstOrDefaultAsync(
                            i =>
                                i.CategoryId ==
                                category.CategoryId &&
                                i.Name ==
                                itemData.Name);

                if (existingItem == null)
                {
                    var item = new PackageItem(
                        category.CategoryId,
                        itemData.Name,
                        itemData.Description,
                        itemData.ServiceValue,
                        itemData.MonthlyPremiumContribution,
                        null,
                        displayOrder);

                    context.PackageItems.Add(item);
                }
                else
                {
                    existingItem.Description =
                        itemData.Description;

                    existingItem.ServiceValue =
                        itemData.ServiceValue;

                    existingItem.MonthlyPremiumContribution =
                        itemData.MonthlyPremiumContribution;

                    existingItem.DisplayOrder =
                        displayOrder;

                    existingItem.IsActive = true;
                }

                displayOrder++;
            }

            await context.SaveChangesAsync();
        }

        private static List<SeedItem> GetItemsForCategory(
            string categoryName)
        {
            return categoryName switch
            {
                "Coffins & Caskets" =>
                    new List<SeedItem>
                    {
                        new("Standard Coffin", "A standard coffin option.", 8000m, 120m),
                        new("Standard Wooden Casket", "A standard wooden casket.", 10000m, 150m),
                        new("Premium Wooden Casket", "A premium wooden casket.", 15000m, 225m),
                        new("Mahogany Casket", "A mahogany casket option.", 20000m, 300m),
                        new("Oak Casket", "An oak casket option.", 18000m, 270m),
                        new("Pine Coffin", "A simple pine coffin.", 7000m, 105m),
                        new("Classic Veneer Casket", "A classic veneer casket.", 12000m, 180m),
                        new("Premium Veneer Casket", "A premium veneer casket.", 16000m, 240m),
                        new("Executive Casket", "An executive-level casket.", 22000m, 330m),
                        new("Deluxe Casket", "A deluxe casket option.", 25000m, 375m)
                    },

                "Funeral Transportation" =>
                    new List<SeedItem>
                    {
                        new("Hearse Transportation", "Hearse transportation service.", 5000m, 75m),
                        new("Family Transport", "Transportation for immediate family members.", 3500m, 55m),
                        new("Additional Hearse Trip", "An additional hearse transportation trip.", 2500m, 40m),
                        new("Airport Transfer", "Transportation to or from an airport.", 3000m, 45m),
                        new("Long-Distance Transport", "Transportation over a long distance.", 7500m, 115m),
                        new("Local Collection Service", "Local collection and transportation service.", 1500m, 25m),
                        new("Family Shuttle", "Shuttle transportation for family members.", 4000m, 60m),
                        new("VIP Family Vehicle", "Premium family transportation.", 5500m, 85m),
                        new("Additional Family Shuttle", "Additional shuttle transportation.", 3000m, 45m),
                        new("Intercity Transport", "Transportation between cities.", 6500m, 100m)
                    },

                "Funeral Service" =>
                    new List<SeedItem>
                    {
                        new("Basic Funeral Service", "Basic funeral service package.", 15000m, 225m),
                        new("Standard Funeral Service", "Standard funeral service package.", 20000m, 300m),
                        new("Enhanced Funeral Service", "Enhanced funeral service package.", 25000m, 375m),
                        new("Premium Funeral Service", "Premium funeral service package.", 30000m, 450m),
                        new("Deluxe Funeral Service", "Deluxe funeral service package.", 35000m, 525m),
                        new("Traditional Funeral Service", "Traditional funeral service package.", 24000m, 360m),
                        new("Contemporary Funeral Service", "Contemporary funeral service package.", 26000m, 390m),
                        new("Family Funeral Service", "Funeral service package designed for family arrangements.", 28000m, 420m),
                        new("Memorial Funeral Service", "Funeral service package with memorial arrangements.", 22000m, 330m),
                        new("Executive Funeral Service", "Executive-level funeral service package.", 40000m, 600m)
                    },

                "Floral Arrangements" =>
                    new List<SeedItem>
                    {
                        new("Standard Wreath", "Standard floral wreath.", 800m, 12m),
                        new("Premium Wreath", "Premium floral wreath.", 1500m, 23m),
                        new("Floral Spray", "Floral spray arrangement.", 1200m, 18m),
                        new("Casket Flowers", "Flowers arranged for the casket.", 2000m, 30m),
                        new("Standing Arrangement", "Standing floral arrangement.", 1800m, 27m),
                        new("Sympathy Bouquet", "Sympathy flower bouquet.", 900m, 14m),
                        new("Premium Bouquet", "Premium flower bouquet.", 1500m, 23m),
                        new("Floral Cross", "Floral cross arrangement.", 1600m, 24m),
                        new("Memorial Flowers", "Flowers for a memorial service.", 1300m, 20m),
                        new("Deluxe Floral Arrangement", "Deluxe floral arrangement.", 2500m, 38m)
                    },

                "Memorial & Stationery" =>
                    new List<SeedItem>
                    {
                        new("Funeral Programme", "Standard funeral programme.", 500m, 8m),
                        new("Premium Funeral Programme", "Premium funeral programme.", 900m, 14m),
                        new("Memorial Cards", "Memorial cards for attendees.", 600m, 9m),
                        new("Thank You Cards", "Thank-you cards for family use.", 400m, 6m),
                        new("Memorial Book", "Memorial book for collecting messages.", 1200m, 18m),
                        new("Guest Book", "Guest book for funeral attendees.", 700m, 11m),
                        new("Memorial Poster", "Memorial poster.", 800m, 12m),
                        new("Photo Display Board", "Photo display board for memorial photographs.", 1000m, 15m),
                        new("Memorial Bookmark Set", "Memorial bookmark set.", 500m, 8m),
                        new("Premium Memorial Book", "Premium memorial book.", 1500m, 23m)
                    },

                "Catering & Refreshments" =>
                    new List<SeedItem>
                    {
                        new("Tea & Coffee Service", "Tea and coffee refreshments.", 1500m, 23m),
                        new("Basic Refreshments", "Basic refreshments for attendees.", 2000m, 30m),
                        new("Standard Catering", "Standard catering service.", 4000m, 60m),
                        new("Premium Catering", "Premium catering service.", 6000m, 90m),
                        new("Light Finger Foods", "Light finger-food selection.", 2500m, 38m),
                        new("Sandwich Platter", "Sandwich platter service.", 2000m, 30m),
                        new("Hot Meal Service", "Hot meal catering service.", 5000m, 75m),
                        new("Beverage Package", "Beverage package.", 1800m, 27m),
                        new("Family Refreshment Package", "Refreshment package for family gatherings.", 3000m, 45m),
                        new("Full Catering Package", "Full catering package.", 7500m, 115m)
                    },

                _ => new List<SeedItem>()
            };
        }

        private record SeedItem(
            string Name,
            string Description,
            decimal ServiceValue,
            decimal MonthlyPremiumContribution);
    }
}
