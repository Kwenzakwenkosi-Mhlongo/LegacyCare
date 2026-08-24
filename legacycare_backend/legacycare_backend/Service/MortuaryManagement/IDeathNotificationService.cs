using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IDeathNotificationService
    {
        DeathNotification CreateNotification(
            DeathNotification notification);

        DeathNotification? GetById(
            string notificationId);

        IEnumerable<DeathNotification> GetAll();

        IEnumerable<DeathNotification> GetByPolicy(
            string policyId);

        IEnumerable<DeathNotification> GetByBranch(
            string branchId);

        void Approve(
            string notificationId,
            string verifiedByUserId);

        void Reject(
            string notificationId,
            string verifiedByUserId,
            string reason);
    }
}