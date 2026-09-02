// ============================================================
// FILE 5
// Path:
// legacycare_backend/legacycare_backend/
// Service/PaymentManagement/IPaymentScheduleService.cs
// ============================================================

namespace PolicyManagement.Service.PaymentManagement
{
    public interface IPaymentScheduleService
    {
        Task<int> GenerateMissingPaymentsAsync(
            CancellationToken cancellationToken = default);

        Task<int> GenerateMissingPaymentsForUserAsync(
            string userId,
            CancellationToken cancellationToken = default);

        Task<int> GenerateMissingPaymentsForPolicyAsync(
            string policyId,
            CancellationToken cancellationToken = default);
    }
}