// ============================================================================
// FILE: Service/MortuaryManagement/IDeathNotificationService.cs
// ============================================================================

using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IDeathNotificationService
    {
        Task<DeathNotification?> GetByIdAsync(
            string notificationId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<DeathNotification>> GetAllAsync(
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<Storage>> GetAvailableStorageUnitsAsync(
            string notificationId,
            CancellationToken cancellationToken = default);

        Task UpdateBodyLocationAsync(
            string notificationId,
            UpdateBodyLocationRequest request,
            CancellationToken cancellationToken = default);

        Task ApproveAsync(
            string notificationId,
            string verifiedByUserId,
            CancellationToken cancellationToken = default);

        Task RejectAsync(
            string notificationId,
            string verifiedByUserId,
            string reason,
            CancellationToken cancellationToken = default);
    }
}

