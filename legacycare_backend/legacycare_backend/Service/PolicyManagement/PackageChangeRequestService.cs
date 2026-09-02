
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Enums;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class PackageChangeRequestService :
        IPackageChangeRequestService
    {
        private readonly AppDbContext _context;
        private readonly IPolicyService _policyService;

        public PackageChangeRequestService(
            AppDbContext context,
            IPolicyService policyService)
        {
            _context = context;
            _policyService = policyService;
        }

        // ========================================================
        // GET ALL REQUESTS
        // ========================================================

        public IEnumerable<ChangePackageRequest> GetAllRequests()
        {
            return _context.ChangePackageRequest
                .AsNoTracking()
                .Include(request => request.User)
                .Include(request => request.Policy)
                .Include(request => request.NewPackage)
                .Include(request => request.Items)
                    .ThenInclude(item => item.PackageItem)
                .OrderByDescending(request =>
                    request.RequestDate)
                .ToList();
        }

        // ========================================================
        // GET REQUEST BY ID
        // ========================================================

        public ChangePackageRequest GetRequestById(
            string requestId)
        {
            if (string.IsNullOrWhiteSpace(requestId))
            {
                throw new ArgumentException(
                    "Request ID is required.",
                    nameof(requestId));
            }

            var request =
                _context.ChangePackageRequest
                    .Include(item => item.User)
                    .Include(item => item.Policy)
                    .Include(item => item.NewPackage)
                    .Include(item => item.Items)
                        .ThenInclude(item => item.PackageItem)
                    .FirstOrDefault(item =>
                        item.RequestId == requestId);

            if (request == null)
            {
                throw new KeyNotFoundException(
                    "Package change request not found.");
            }

            return request;
        }

        // ========================================================
        // GET REQUESTS BY POLICY
        // ========================================================

        public IEnumerable<ChangePackageRequest>
            GetRequestsByPolicy(
                string policyId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            return _context.ChangePackageRequest
                .AsNoTracking()
                .Include(request => request.User)
                .Include(request => request.Policy)
                .Include(request => request.NewPackage)
                .Include(request => request.Items)
                    .ThenInclude(item => item.PackageItem)
                .Where(request =>
                    request.PolicyId == policyId)
                .OrderByDescending(request =>
                    request.RequestDate)
                .ToList();
        }

        // ========================================================
        // GET CLIENT REQUESTS BY POLICY
        // ========================================================

        public IEnumerable<ChangePackageRequest>
            GetRequestsByPolicyForClient(
                string policyId,
                string userId)
        {
            EnsureClientOwnsPolicy(
                policyId,
                userId);

            return _context.ChangePackageRequest
                .AsNoTracking()
                .Include(request => request.NewPackage)
                .Include(request => request.Items)
                    .ThenInclude(item => item.PackageItem)
                .Where(request =>
                    request.PolicyId == policyId &&
                    request.UserId == userId)
                .OrderByDescending(request =>
                    request.RequestDate)
                .ToList();
        }

        // ========================================================
        // CREATE REQUEST
        // ========================================================

        public ChangePackageRequest CreateRequest(
            ChangePackageRequest request,
            string userId)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }

            if (string.IsNullOrWhiteSpace(request.PolicyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(request));
            }

            ValidateRequestType(request);

            // ----------------------------------------------------
            // Find client account
            // ----------------------------------------------------

            var client =
                _context.Client
                    .AsNoTracking()
                    .FirstOrDefault(item =>
                        item.UserId == userId);

            if (client == null)
            {
                throw new KeyNotFoundException(
                    "Client account was not found.");
            }

            if (string.IsNullOrWhiteSpace(
                client.ClientId))
            {
                throw new InvalidOperationException(
                    "The client account does not have a valid ClientId.");
            }

            var clientId =
                client.ClientId;

            // ----------------------------------------------------
            // Verify policy belongs to logged-in client
            // ----------------------------------------------------

            var policy =
                _context.Policy
                    .Include(item => item.Package)
                    .FirstOrDefault(item =>
                        item.PolicyId ==
                            request.PolicyId &&
                        item.UserId == userId);

            if (policy == null)
            {
                throw new KeyNotFoundException(
                    "Policy not found or does not belong to this client.");
            }

            // ----------------------------------------------------
            // Prevent multiple pending requests
            // ----------------------------------------------------

            var hasPendingRequest =
                _context.ChangePackageRequest
                    .Any(existing =>
                        existing.PolicyId ==
                            request.PolicyId &&
                        existing.UserId == userId &&
                        existing.Status ==
                            RequestStatus.Pending);

            if (hasPendingRequest)
            {
                throw new InvalidOperationException(
                    "This policy already has a pending package change request.");
            }

            // ----------------------------------------------------
            // Server owns the request ID
            // ----------------------------------------------------

            request.RequestId =
                Guid.NewGuid().ToString();

            // ----------------------------------------------------
            // Prepare request according to type
            // ----------------------------------------------------

            if (request.RequestType ==
                PackageChangeRequestType.NormalPackage)
            {
                PrepareNormalPackageRequest(
                    request,
                    policy.PackageId);
            }
            else if (request.RequestType ==
                     PackageChangeRequestType.CustomPackage)
            {
                PrepareCustomPackageRequest(
                    request);
            }

            // ----------------------------------------------------
            // Server owns these values
            // ----------------------------------------------------

            request.UserId =
                userId;

            request.ClientId =
                clientId;

            request.RequestDate =
                DateTime.UtcNow;

            request.Status =
                RequestStatus.Pending;

            // ----------------------------------------------------
            // Save request
            // ----------------------------------------------------

            _context.ChangePackageRequest.Add(
                request);

            _context.SaveChanges();

            return GetRequestById(
                request.RequestId);
        }

        // ========================================================
        // APPROVE REQUEST
        // ========================================================

        public void ApproveRequest(
            string requestId)
        {
            var request =
                GetRequestById(requestId);

            if (request.Status !=
                RequestStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending package change requests can be approved.");
            }

            // ----------------------------------------------------
            // Custom packages have their own approval workflow.
            // Step 16 will implement the actual custom package
            // approval transaction.
            // ----------------------------------------------------

            if (request.RequestType ==
                PackageChangeRequestType.CustomPackage)
            {
                throw new InvalidOperationException(
                    "Custom package requests must be approved through the custom package approval workflow.");
            }

            if (request.RequestType !=
                PackageChangeRequestType.NormalPackage)
            {
                throw new InvalidOperationException(
                    "Invalid package change request type.");
            }

            // ----------------------------------------------------
            // Normal package validation
            // ----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                request.NewPackageId))
            {
                throw new InvalidOperationException(
                    "A normal package request must have a package ID.");
            }

            var policyExists =
                _context.Policy.Any(policy =>
                    policy.PolicyId ==
                    request.PolicyId);

            if (!policyExists)
            {
                throw new KeyNotFoundException(
                    "Policy linked to this request was not found.");
            }

            var packageExists =
                _context.Package.Any(package =>
                    package.PackageId ==
                    request.NewPackageId);

            if (!packageExists)
            {
                throw new KeyNotFoundException(
                    "Requested package was not found.");
            }

            // ----------------------------------------------------
            // Apply normal package change
            // ----------------------------------------------------

            _policyService.ChangePackage(
                request.PolicyId,
                request.NewPackageId);

            request.Approve();

            _context.SaveChanges();
        }

        // ========================================================
        // REJECT REQUEST
        // ========================================================

        public void RejectRequest(
            string requestId)
        {
            var request =
                GetRequestById(requestId);

            if (request.Status !=
                RequestStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Only pending package change requests can be rejected.");
            }

            request.Reject();

            _context.SaveChanges();
        }

        // ========================================================
        // DELETE REQUEST
        // ========================================================

        public void DeleteRequest(
            string requestId)
        {
            var request =
                GetRequestById(requestId);

            _context.ChangePackageRequest.Remove(
                request);

            _context.SaveChanges();
        }

        // ========================================================
        // VALIDATE REQUEST TYPE
        // ========================================================

        private void ValidateRequestType(
            ChangePackageRequest request)
        {
            if (request.RequestType !=
                    PackageChangeRequestType.NormalPackage &&
                request.RequestType !=
                    PackageChangeRequestType.CustomPackage)
            {
                throw new ArgumentException(
                    "Invalid package change request type.",
                    nameof(request));
            }
        }

        // ========================================================
        // PREPARE NORMAL PACKAGE REQUEST
        // ========================================================

        private void PrepareNormalPackageRequest(
            ChangePackageRequest request,
            string currentPackageId)
        {
            if (string.IsNullOrWhiteSpace(
                request.NewPackageId))
            {
                throw new ArgumentException(
                    "New package ID is required for a normal package request.",
                    nameof(request));
            }

            if (request.Items != null &&
                request.Items.Any())
            {
                throw new ArgumentException(
                    "Normal package requests cannot contain custom package items.",
                    nameof(request));
            }

            var newPackage =
                _context.Package
                    .AsNoTracking()
                    .FirstOrDefault(package =>
                        package.PackageId ==
                        request.NewPackageId);

            if (newPackage == null)
            {
                throw new KeyNotFoundException(
                    "Package not found.");
            }

            if (currentPackageId ==
                request.NewPackageId)
            {
                throw new InvalidOperationException(
                    "The selected package is already active on this policy.");
            }

            request.NewPackageId =
                newPackage.PackageId;

            request.Items =
                new List<PackageChangeRequestItem>();
        }

        // ========================================================
        // PREPARE CUSTOM PACKAGE REQUEST
        // ========================================================

        private void PrepareCustomPackageRequest(
            ChangePackageRequest request)
        {
            // ----------------------------------------------------
            // Custom package must NOT reference a predefined
            // package.
            // ----------------------------------------------------

            if (!string.IsNullOrWhiteSpace(
                request.NewPackageId))
            {
                throw new ArgumentException(
                    "Custom package requests cannot contain a predefined package ID.",
                    nameof(request));
            }

            // ----------------------------------------------------
            // Must contain selected items.
            // ----------------------------------------------------

            if (request.Items == null ||
                !request.Items.Any())
            {
                throw new ArgumentException(
                    "At least one package item must be selected for a custom package request.",
                    nameof(request));
            }

            // ----------------------------------------------------
            // Extract submitted item IDs only.
            //
            // IMPORTANT:
            // We do NOT trust prices/service values sent by
            // the client.
            // ----------------------------------------------------

            var submittedItemIds =
                request.Items
                    .Select(item =>
                        item.PackageItemId)
                    .Where(id =>
                        !string.IsNullOrWhiteSpace(id))
                    .ToList();

            if (submittedItemIds.Count == 0)
            {
                throw new ArgumentException(
                    "At least one valid package item must be selected.",
                    nameof(request));
            }

            // ----------------------------------------------------
            // Duplicate protection
            // ----------------------------------------------------

            var duplicateItemIds =
                submittedItemIds
                    .GroupBy(id => id)
                    .Where(group =>
                        group.Count() > 1)
                    .Select(group =>
                        group.Key)
                    .ToList();

            if (duplicateItemIds.Any())
            {
                throw new ArgumentException(
                    "The same package item cannot be selected more than once.",
                    nameof(request));
            }

            // ----------------------------------------------------
            // Load the selected items from the DATABASE.
            //
            // Prices and service values will come from here.
            // ----------------------------------------------------

            var packageItems =
                _context.PackageItems
                    .AsNoTracking()
                    .Include(item => item.Category)
                    .Where(item =>
                        submittedItemIds.Contains(
                            item.PackageItemId))
                    .ToList();

            // ----------------------------------------------------
            // Check whether every submitted item exists.
            // ----------------------------------------------------

            if (packageItems.Count !=
                submittedItemIds.Count)
            {
                var foundIds =
                    packageItems
                        .Select(item =>
                            item.PackageItemId)
                        .ToHashSet();

                var missingIds =
                    submittedItemIds
                        .Where(id =>
                            !foundIds.Contains(id))
                        .ToList();

                throw new KeyNotFoundException(
                    "One or more selected package items were not found: " +
                    string.Join(", ", missingIds));
            }

            // ----------------------------------------------------
            // Every selected item must be active.
            // ----------------------------------------------------

            var inactiveItems =
                packageItems
                    .Where(item =>
                        !item.IsActive)
                    .Select(item =>
                        item.Name)
                    .ToList();

            if (inactiveItems.Any())
            {
                throw new InvalidOperationException(
                    "One or more selected package items are no longer active: " +
                    string.Join(", ", inactiveItems));
            }

            // ----------------------------------------------------
            // Every selected item must belong to an active
            // category.
            // ----------------------------------------------------

            var itemsWithInvalidCategory =
                packageItems
                    .Where(item =>
                        item.Category == null ||
                        !item.Category.IsActive)
                    .Select(item =>
                        item.Name)
                    .ToList();

            if (itemsWithInvalidCategory.Any())
            {
                throw new InvalidOperationException(
                    "One or more selected package items belong to an inactive or invalid category: " +
                    string.Join(
                        ", ",
                        itemsWithInvalidCategory));
            }

            // ----------------------------------------------------
            // Group selected items by category.
            // ----------------------------------------------------

            var selectedByCategory =
                packageItems
                    .GroupBy(item =>
                        item.CategoryId)
                    .ToDictionary(
                        group =>
                            group.Key,
                        group =>
                            group.ToList());

            // ----------------------------------------------------
            // Load all active categories.
            //
            // This is important because the client must satisfy
            // the selection requirements for every active
            // category, not just categories containing submitted
            // items.
            // ----------------------------------------------------

            var activeCategories =
                _context.PackageItemCategories
                    .AsNoTracking()
                    .Where(category =>
                        category.IsActive)
                    .ToList();

            if (!activeCategories.Any())
            {
                throw new InvalidOperationException(
                    "No active package item categories are currently available.");
            }

            // ----------------------------------------------------
            // Validate selection rules for EVERY active category.
            // ----------------------------------------------------

            foreach (var category in activeCategories)
            {
                var selectedCount =
                    selectedByCategory.TryGetValue(
                        category.CategoryId,
                        out var categoryItems)
                            ? categoryItems.Count
                            : 0;

                // ------------------------------------------------
                // Minimum selection
                // ------------------------------------------------

                if (selectedCount <
                    category.MinimumSelections)
                {
                    throw new InvalidOperationException(
                        $"{category.Name}: At least {category.MinimumSelections} item(s) must be selected.");
                }

                // ------------------------------------------------
                // Maximum selection
                // ------------------------------------------------

                if (selectedCount >
                    category.MaximumSelections)
                {
                    throw new InvalidOperationException(
                        $"{category.Name}: A maximum of {category.MaximumSelections} item(s) may be selected.");
                }

                // ------------------------------------------------
                // Single selection category
                // ------------------------------------------------

                if (category.SelectionMode
                        .ToString()
                        .Contains(
                            "Single",
                            StringComparison.OrdinalIgnoreCase) &&
                    selectedCount > 1)
                {
                    throw new InvalidOperationException(
                        $"{category.Name}: Only one item may be selected from this category.");
                }
            }

            // ----------------------------------------------------
            // Build validated request items.
            //
            // CRITICAL:
            // MonthlyPremiumContribution and ServiceValue are
            // copied from the DATABASE.
            //
            // Any values submitted by the frontend are ignored.
            // ----------------------------------------------------

            var packageItemLookup =
                packageItems.ToDictionary(
                    item =>
                        item.PackageItemId);

            var validatedItems =
                new List<PackageChangeRequestItem>();

            foreach (var submittedItem in request.Items)
            {
                if (string.IsNullOrWhiteSpace(
                    submittedItem.PackageItemId))
                {
                    continue;
                }

                if (!packageItemLookup.TryGetValue(
                    submittedItem.PackageItemId,
                    out var packageItem))
                {
                    throw new KeyNotFoundException(
                        $"Package item '{submittedItem.PackageItemId}' was not found.");
                }

                validatedItems.Add(
                    new PackageChangeRequestItem
                    {
                        PackageChangeRequestItemId =
                            Guid.NewGuid().ToString(),

                        RequestId =
                            request.RequestId,

                        PackageItemId =
                            packageItem.PackageItemId,

                        // ----------------------------------------
                        // SERVER/DATABASE AUTHORITATIVE VALUES
                        // ----------------------------------------

                        MonthlyPremiumContribution =
                            packageItem.MonthlyPremiumContribution,

                        ServiceValue =
                            packageItem.ServiceValue,

                        DateCreated =
                            DateTime.UtcNow
                    });
            }

            if (!validatedItems.Any())
            {
                throw new ArgumentException(
                    "No valid package items were selected.",
                    nameof(request));
            }

            // ----------------------------------------------------
            // Replace client-provided Items with the validated
            // server-generated collection.
            // ----------------------------------------------------

            request.Items =
                validatedItems;
        }

        // ========================================================
        // ENSURE CLIENT OWNS POLICY
        // ========================================================

        private void EnsureClientOwnsPolicy(
            string policyId,
            string userId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }

            var exists =
                _context.Policy
                    .AsNoTracking()
                    .Any(policy =>
                        policy.PolicyId == policyId &&
                        policy.UserId == userId);

            if (!exists)
            {
                throw new KeyNotFoundException(
                    "Policy not found or does not belong to this client.");
            }
        }
    }
}
