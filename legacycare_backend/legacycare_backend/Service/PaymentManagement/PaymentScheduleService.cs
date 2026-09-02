// ============================================================
// FILE 6
// Path:
// legacycare_backend/legacycare_backend/
// Service/PaymentManagement/PaymentScheduleService.cs
// ============================================================

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Enums;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PaymentManagement
{
    public class PaymentScheduleService : IPaymentScheduleService
    {
        private readonly AppDbContext _context;

        public PaymentScheduleService(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> GenerateMissingPaymentsAsync(
            CancellationToken cancellationToken = default)
        {
            var policies = await _context.Policy
                .Include(policy => policy.Package)
                .Where(policy =>
                    policy.Status == PolicyStatus.Active &&
                    policy.Package != null)
                .ToListAsync(cancellationToken);

            return await GenerateAndSaveAsync(
                policies,
                cancellationToken);
        }

        public async Task<int> GenerateMissingPaymentsForUserAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }

            var policies = await _context.Policy
                .Include(policy => policy.Package)
                .Where(policy =>
                    policy.UserId == userId &&
                    policy.Status == PolicyStatus.Active &&
                    policy.Package != null)
                .ToListAsync(cancellationToken);

            return await GenerateAndSaveAsync(
                policies,
                cancellationToken);
        }

        public async Task<int> GenerateMissingPaymentsForPolicyAsync(
            string policyId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            var policy = await _context.Policy
                .Include(policy => policy.Package)
                .FirstOrDefaultAsync(
                    policy => policy.PolicyId == policyId,
                    cancellationToken);

            if (policy == null)
            {
                throw new KeyNotFoundException(
                    $"Policy '{policyId}' was not found.");
            }

            if (policy.Status != PolicyStatus.Active)
            {
                return 0;
            }

            if (policy.Package == null)
            {
                throw new InvalidOperationException(
                    "The policy is not linked to a package.");
            }

            return await GenerateAndSaveAsync(
                new[] { policy },
                cancellationToken);
        }

        private async Task<int> GenerateAndSaveAsync(
            IEnumerable<Policy> policies,
            CancellationToken cancellationToken)
        {
            var created = 0;

            foreach (var policy in policies)
            {
                created += await GenerateForPolicyAsync(
                    policy,
                    cancellationToken);
            }

            if (created > 0)
            {
                await _context.SaveChangesAsync(
                    cancellationToken);
            }

            return created;
        }

        private async Task<int> GenerateForPolicyAsync(
            Policy policy,
            CancellationToken cancellationToken)
        {
            if (policy.Package == null)
            {
                return 0;
            }

            if (policy.Package.MonthlyPremium <= 0)
            {
                throw new InvalidOperationException(
                    $"Package '{policy.Package.PackageId}' has an invalid monthly premium.");
            }

            var amount = Convert.ToDecimal(
                policy.Package.MonthlyPremium);

            var existingDates = (
                await _context.Payment
                    .AsNoTracking()
                    .Where(payment =>
                        payment.PolicyId == policy.PolicyId)
                    .Select(payment => payment.DueDate)
                    .ToListAsync(cancellationToken))
                .Select(date => date.Date)
                .ToHashSet();

            var paymentNumber = 1;
            var created = 0;
            var today = DateTime.UtcNow.Date;

            while (true)
            {
                var dueDate =
                    Models.PaymentManagement.Payment.CalculateDueDate(
                        policy.StartDate,
                        paymentNumber);

                if (policy.EndDate.HasValue &&
                    dueDate.Date > policy.EndDate.Value.Date)
                {
                    break;
                }

                if (!existingDates.Contains(
                        dueDate.Date))
                {
                    var payment =
                        new Models.PaymentManagement.Payment(
                            amount,
                            policy.PolicyId,
                            dueDate);

                    _context.Payment.Add(payment);

                    existingDates.Add(
                        dueDate.Date);

                    created++;
                }

                /*
                 * Historical periods plus one upcoming premium.
                 */
                if (dueDate.Date > today)
                {
                    break;
                }

                paymentNumber++;
            }

            return created;
        }
    }
}
