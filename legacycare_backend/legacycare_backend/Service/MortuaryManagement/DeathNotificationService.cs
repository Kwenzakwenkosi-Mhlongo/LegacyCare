// ============================================================================
// FILE: Service/MortuaryManagement/DeathNotificationService.cs
// ============================================================================

using System.Data;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class DeathNotificationService : IDeathNotificationService
    {
        private readonly AppDbContext _context;

        public DeathNotificationService(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<DeathNotification?> GetByIdAsync(
            string notificationId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(notificationId))
            {
                return null;
            }

            return await _context.DeathNotifications
                .AsNoTracking()
                .Include(x => x.Policy)
                .Include(x => x.Beneficiary)
                .Include(x => x.ReportedByUser)
                .Include(x => x.Branch)
                .Include(x => x.VerifiedBy)
                .Include(x => x.Storage)
                .FirstOrDefaultAsync(
                    x =>
                        x.DeathNotificationId ==
                        notificationId,
                    cancellationToken);
        }

        public async Task<IReadOnlyList<DeathNotification>>
            GetAllAsync(
                CancellationToken cancellationToken = default)
        {
            return await _context.DeathNotifications
                .AsNoTracking()
                .Include(x => x.Policy)
                .Include(x => x.Beneficiary)
                .Include(x => x.ReportedByUser)
                .Include(x => x.Branch)
                .Include(x => x.VerifiedBy)
                .Include(x => x.Storage)
                .OrderByDescending(x => x.DateReported)
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<Storage>>
            GetAvailableStorageUnitsAsync(
                string notificationId,
                CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(notificationId))
            {
                throw new ArgumentException(
                    "Death notification ID is required.",
                    nameof(notificationId));
            }

            var notification =
                await _context.DeathNotifications
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        x =>
                            x.DeathNotificationId ==
                            notificationId,
                        cancellationToken);

            if (notification == null)
            {
                throw new KeyNotFoundException(
                    "Death notification not found.");
            }

            if (notification.Status !=
                DeathNotificationStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Storage can only be selected for a pending death notification.");
            }

            return await _context.StorageUnit
                .AsNoTracking()
                .Where(
                    x =>
                        x.BranchId ==
                        notification.BranchId &&
                        (
                            x.IsAvailable ||
                            x.StorageId ==
                            notification.StorageId
                        ))
                .OrderBy(x => x.UnitNumber)
                .ToListAsync(cancellationToken);
        }

        public async Task UpdateBodyLocationAsync(
            string notificationId,
            UpdateBodyLocationRequest request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(notificationId))
            {
                throw new ArgumentException(
                    "Death notification ID is required.",
                    nameof(notificationId));
            }

            ArgumentNullException.ThrowIfNull(request);

            var strategy =
                _context.Database.CreateExecutionStrategy();

            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction =
                    await _context.Database
                        .BeginTransactionAsync(
                            IsolationLevel.Serializable,
                            cancellationToken);

                try
                {
                    var notification =
                        await _context.DeathNotifications
                            .Include(x => x.Branch)
                            .FirstOrDefaultAsync(
                                x =>
                                    x.DeathNotificationId ==
                                    notificationId,
                                cancellationToken);

                    if (notification == null)
                    {
                        throw new KeyNotFoundException(
                            "Death notification not found.");
                    }

                    if (notification.Status !=
                        DeathNotificationStatus.Pending)
                    {
                        throw new InvalidOperationException(
                            "Only pending death notifications can have their body location updated.");
                    }

                    var normalizedLocation =
                        BodyLocationTypes.Normalize(
                            request.BodyLocationType);

                    var oldStorageId =
                        notification.StorageId;

                    Storage? oldStorage = null;

                    if (!string.IsNullOrWhiteSpace(
                            oldStorageId))
                    {
                        oldStorage =
                            await _context.StorageUnit
                                .FirstOrDefaultAsync(
                                    x =>
                                        x.StorageId ==
                                        oldStorageId,
                                    cancellationToken);
                    }

                    var storageChanged =
                        !string.Equals(
                            oldStorageId,
                            request.StorageId,
                            StringComparison.OrdinalIgnoreCase);

                    var leavingLegacyCare =
                        normalizedLocation !=
                        BodyLocationTypes.LegacyCareMortuary;

                    if (oldStorage != null &&
                        (storageChanged ||
                         leavingLegacyCare))
                    {
                        oldStorage.MarkAvailable();
                        notification.ClearStorageReservation();
                    }

                   notification.SetBodyLocation(
    normalizedLocation,
    request.BodyLocationAddress,
    request.MortuaryName,
    request.CollectionDate,
    request.CollectionNotes);

                    if (normalizedLocation ==
                        BodyLocationTypes.LegacyCareMortuary)
                    {
                        if (string.IsNullOrWhiteSpace(
                                request.StorageId))
                        {
                            throw new ArgumentException(
                                "Please select an available storage unit.");
                        }

                        var selectedStorage =
                            await _context.StorageUnit
                                .FirstOrDefaultAsync(
                                    x =>
                                        x.StorageId ==
                                            request.StorageId &&
                                        x.BranchId ==
                                            notification.BranchId,
                                    cancellationToken);

                        if (selectedStorage == null)
                        {
                            throw new ArgumentException(
                                "The selected storage unit does not exist at this branch.");
                        }

                        var retainingExistingUnit =
                            string.Equals(
                                oldStorageId,
                                selectedStorage.StorageId,
                                StringComparison.OrdinalIgnoreCase);

                        if (!selectedStorage.IsAvailable &&
                            !retainingExistingUnit)
                        {
                            throw new InvalidOperationException(
                                "The selected storage unit is no longer available. Please select another unit.");
                        }

                        selectedStorage.MarkUnavailable();

                        notification.ReserveStorage(
                            selectedStorage);

                        if (string.IsNullOrWhiteSpace(
                                request.MortuaryName) &&
                            notification.Branch != null)
                        {
                           notification.SetBodyLocation(
    BodyLocationTypes.LegacyCareMortuary,
    request.BodyLocationAddress,
    string.IsNullOrWhiteSpace(request.MortuaryName)
        ? notification.Branch?.BranchName
        : request.MortuaryName,
    request.CollectionDate,
    request.CollectionNotes);

notification.ReserveStorage(selectedStorage);
                            notification.ReserveStorage(
                                selectedStorage);
                        }
                    }

                    await _context.SaveChangesAsync(
                        cancellationToken);

                    await transaction.CommitAsync(
                        cancellationToken);
                }
                catch
                {
                    await transaction.RollbackAsync(
                        cancellationToken);

                    throw;
                }
            });
        }

       public async Task ApproveAsync(
    string notificationId,
    string verifiedByUserId,
    CancellationToken cancellationToken = default)
{
    if (string.IsNullOrWhiteSpace(notificationId))
    {
        throw new ArgumentException(
            "Death notification ID is required.",
            nameof(notificationId));
    }

    if (string.IsNullOrWhiteSpace(verifiedByUserId))
    {
        throw new ArgumentException(
            "Verified-by user ID is required.",
            nameof(verifiedByUserId));
    }

    var strategy =
        _context.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () =>
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            var notification =
                await _context.DeathNotifications
                    .Include(x => x.Beneficiary)
                    .Include(x => x.Policy)
                    .FirstOrDefaultAsync(
                        x =>
                            x.DeathNotificationId ==
                            notificationId,
                        cancellationToken);

            if (notification == null)
            {
                throw new KeyNotFoundException(
                    "Death notification not found.");
            }

            if (notification.Beneficiary == null)
            {
                throw new InvalidOperationException(
                    "The beneficiary associated with this notification was not found.");
            }

            if (notification.Policy == null)
            {
                throw new InvalidOperationException(
                    "The policy associated with this notification was not found.");
            }

            if (string.IsNullOrWhiteSpace(
                notification.BranchId))
            {
                throw new InvalidOperationException(
                    "This death notification has no branch assigned.");
            }

            var beneficiary =
                notification.Beneficiary;

            if (beneficiary.Status ==
                BeneficiaryStatus.Removed)
            {
                throw new InvalidOperationException(
                    "A removed beneficiary cannot be marked as deceased.");
            }

            var gender =
                NormalizeGender(
                    beneficiary.Gender);

            // DeathNotification: Pending -> Approved
            notification.Approve(
                verifiedByUserId);

            // Keep the linked ServiceRequest synchronized.
            var serviceRequest =
                await _context.ServiceRequests
                    .FirstOrDefaultAsync(
                        x =>
                            x.DeathNotificationId ==
                            notificationId,
                        cancellationToken);

            if (serviceRequest != null)
            {
                serviceRequest.Status =
                    "Approved";

                serviceRequest.UpdatedDate =
                    DateTime.UtcNow;
            }

            if (beneficiary.Status !=
                BeneficiaryStatus.Deceased)
            {
                beneficiary.MarkAsDeceased();
            }

            var existingDeceased =
                await _context.Deceased
                    .FirstOrDefaultAsync(
                        x =>
                            x.BeneficiaryId ==
                            beneficiary.BeneficiaryId,
                        cancellationToken);

            if (existingDeceased == null)
            {
                var deceased =
                    new Deceased(
                        beneficiary.FullName,
                        beneficiary.IDNumber,
                        beneficiary.DateOfBirth,
                        notification.DateOfDeath,
                        gender,
                        notification.PolicyId,
                        beneficiary.BeneficiaryId,
                        null);

                _context.Deceased.Add(
                    deceased);
            }

            await _context.SaveChangesAsync(
                cancellationToken);

            await transaction.CommitAsync(
                cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    });
}


public async Task RejectAsync(
    string notificationId,
    string verifiedByUserId,
    string reason,
    CancellationToken cancellationToken = default)
{
    if (string.IsNullOrWhiteSpace(notificationId))
    {
        throw new ArgumentException(
            "Death notification ID is required.",
            nameof(notificationId));
    }

    if (string.IsNullOrWhiteSpace(verifiedByUserId))
    {
        throw new ArgumentException(
            "Verified-by user ID is required.",
            nameof(verifiedByUserId));
    }

    if (string.IsNullOrWhiteSpace(reason))
    {
        throw new ArgumentException(
            "A rejection reason is required.",
            nameof(reason));
    }

    var strategy =
        _context.Database.CreateExecutionStrategy();

    await strategy.ExecuteAsync(async () =>
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            var notification =
                await _context.DeathNotifications
                    .FirstOrDefaultAsync(
                        x =>
                            x.DeathNotificationId ==
                            notificationId,
                        cancellationToken);

            if (notification == null)
            {
                throw new KeyNotFoundException(
                    "Death notification not found.");
            }

            // DeathNotification: Pending -> Rejected
            notification.Reject(
                verifiedByUserId,
                reason);

            // Keep ServiceRequest synchronized.
            var serviceRequest =
                await _context.ServiceRequests
                    .FirstOrDefaultAsync(
                        x =>
                            x.DeathNotificationId ==
                            notificationId,
                        cancellationToken);

            if (serviceRequest != null)
            {
                serviceRequest.Status =
                    "Rejected";

                serviceRequest.UpdatedDate =
                    DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(
                cancellationToken);

            await transaction.CommitAsync(
                cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    });
}

        private static string NormalizeGender(
            string gender)
        {
            if (string.IsNullOrWhiteSpace(gender))
            {
                throw new InvalidOperationException(
                    "The beneficiary has no gender recorded.");
            }

            if (gender.Equals(
                    "Male",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "Male";
            }

            if (gender.Equals(
                    "Female",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "Female";
            }

            throw new InvalidOperationException(
                $"The beneficiary gender value '{gender}' is invalid. Expected Male or Female.");
        }
    }
}
