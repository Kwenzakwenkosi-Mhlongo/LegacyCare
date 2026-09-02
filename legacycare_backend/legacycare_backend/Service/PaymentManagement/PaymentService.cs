// File:
// legacycare_backend/legacycare_backend/
// Service/PaymentManagement/PaymentService.cs

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models;
using PolicyManagement.Models.PaymentManagement;

namespace PolicyManagement.Service.PaymentManagement
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;

        public PaymentService(
            AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Payment> GetAllPayments()
        {
            return _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .OrderByDescending(payment => payment.DueDate)
                .ThenByDescending(payment => payment.PaymentDate)
                .ToList();
        }

        public IEnumerable<Payment> GetPaymentsByUser(
            string userId)
        {
            ValidateUserId(userId);

            return _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .Where(payment =>
                    payment.Policy.UserId == userId)
                .OrderByDescending(payment => payment.DueDate)
                .ThenByDescending(payment => payment.PaymentDate)
                .ToList();
        }

        public IEnumerable<Payment> GetPaymentHistory(
            string userId)
        {
            ValidateUserId(userId);

            return _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .Where(payment =>
                    payment.Policy.UserId == userId &&
                    payment.Status == PaymentStatus.SUCCESSFUL)
                .OrderByDescending(payment => payment.PaymentDate)
                .ThenByDescending(payment => payment.DueDate)
                .ToList();
        }

        public Payment GetPaymentById(
            string paymentId,
            string userId)
        {
            ValidateUserId(userId);

            if (string.IsNullOrWhiteSpace(paymentId))
            {
                throw new ArgumentException(
                    "Payment ID is required.",
                    nameof(paymentId));
            }

            var payment = _context.Payment
                .AsNoTracking()
                .Include(item => item.Policy)
                    .ThenInclude(policy => policy.Package)
                .FirstOrDefault(item =>
                    item.PaymentId == paymentId &&
                    item.Policy.UserId == userId);

            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment not found.");
            }

            return payment;
        }

        public IEnumerable<Payment> GetPaymentsByPolicy(
            string userId,
            string policyId)
        {
            ValidateUserId(userId);

            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            var policyExists = _context.Policy
                .AsNoTracking()
                .Any(policy =>
                    policy.PolicyId == policyId &&
                    policy.UserId == userId);

            if (!policyExists)
            {
                throw new KeyNotFoundException(
                    "Policy not found.");
            }

            return _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .Where(payment =>
                    payment.PolicyId == policyId &&
                    payment.Policy.UserId == userId)
                .OrderByDescending(payment => payment.DueDate)
                .ToList();
        }

        public IEnumerable<Payment> GetOutstandingPayments(
            string userId)
        {
            ValidateUserId(userId);

            var today =
                DateTime.UtcNow.Date;

            return _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .Where(payment =>
                    payment.Policy.UserId == userId &&
                    payment.Status == PaymentStatus.PENDING &&
                    payment.DueDate.Date < today)
                .OrderBy(payment => payment.DueDate)
                .ToList();
        }

        public IEnumerable<Payment> SearchPayments(
            string userId,
            string keyword)
        {
            ValidateUserId(userId);

            if (string.IsNullOrWhiteSpace(keyword))
            {
                return GetPaymentsByUser(
                    userId);
            }

            var normalizedKeyword =
                keyword.Trim();

            var payments = _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .Where(payment =>
                    payment.Policy.UserId == userId)
                .OrderByDescending(payment => payment.DueDate)
                .ToList();

            return payments.Where(payment =>
                ContainsIgnoreCase(
                    payment.PaymentId,
                    normalizedKeyword) ||
                ContainsIgnoreCase(
                    payment.PolicyId,
                    normalizedKeyword) ||
                ContainsIgnoreCase(
                    payment.Status.ToString(),
                    normalizedKeyword) ||
                (
                    payment.Method.HasValue &&
                    ContainsIgnoreCase(
                        payment.Method.Value.ToString(),
                        normalizedKeyword)
                ));
        }

        public Payment MakePayment(
            string userId,
            MakePaymentRequest request)
        {
            ValidateUserId(userId);

            if (request == null)
            {
                throw new ArgumentNullException(
                    nameof(request));
            }

            ValidateOnlinePaymentMethod(
                request.Method);

            var policy = GetOwnedActivePolicy(
                request.PolicyId,
                userId);

            var package =
                GetRequiredPackage(
                    policy);

            var payablePayment =
                _context.Payment
                    .Include(payment => payment.Policy)
                        .ThenInclude(item => item.Package)
                    .Where(payment =>
                        payment.PolicyId == policy.PolicyId &&
                        (
                            payment.Status == PaymentStatus.PENDING ||
                            payment.Status == PaymentStatus.FAILED
                        ))
                    .OrderBy(payment => payment.DueDate)
                    .FirstOrDefault();

            if (payablePayment != null)
            {
                if (payablePayment.Status == PaymentStatus.FAILED)
                {
                    payablePayment.MarkPending();
                }

                payablePayment.SelectPaymentMethod(
                    request.Method);

                _context.SaveChanges();

                return payablePayment;
            }

            var nextDueDate =
                CalculateNextPaymentDueDate(
                    policy);

            var payment =
                new Payment(
                    (decimal)package.MonthlyPremium,
                    policy.PolicyId,
                    nextDueDate);

            payment.SelectPaymentMethod(
                request.Method);

            _context.Payment.Add(
                payment);

            _context.SaveChanges();

            return payment;
        }

        public Payment ConfirmPayment(
            string paymentId,
            string userId,
            PaymentMethodType method)
        {
            ValidateUserId(userId);

            if (string.IsNullOrWhiteSpace(paymentId))
            {
                throw new ArgumentException(
                    "Payment ID is required.",
                    nameof(paymentId));
            }

            ValidateOnlinePaymentMethod(
                method);

            var payment = _context.Payment
                .Include(item => item.Policy)
                    .ThenInclude(policy => policy.Package)
                .FirstOrDefault(item =>
                    item.PaymentId == paymentId &&
                    item.Policy.UserId == userId);

            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment not found.");
            }

            if (payment.Status == PaymentStatus.SUCCESSFUL)
            {
                throw new InvalidOperationException(
                    "This payment has already been completed successfully.");
            }

            if (payment.Status != PaymentStatus.PENDING &&
                payment.Status != PaymentStatus.FAILED)
            {
                throw new InvalidOperationException(
                    "This payment cannot be confirmed.");
            }

            ValidatePaymentForConfirmation(
                payment,
                userId);

            if (payment.Status == PaymentStatus.FAILED)
            {
                payment.MarkPending();
            }

            payment.MarkSuccessful(
                method);

            _context.SaveChanges();

            return payment;
        }

        public Payment CreateMonthlyPayment(
            string policyId,
            string userId)
        {
            ValidateUserId(userId);

            var policy =
                GetOwnedActivePolicy(
                    policyId,
                    userId);

            var package =
                GetRequiredPackage(
                    policy);

            var nextDueDate =
                CalculateNextPaymentDueDate(
                    policy);

            var existingPayment =
                FindPaymentForDueDate(
                    policy.PolicyId,
                    nextDueDate);

            if (existingPayment != null)
            {
                throw new InvalidOperationException(
                    $"A payment already exists for the due date {nextDueDate:yyyy-MM-dd}.");
            }

            /*
             * A monthly premium is only a scheduled obligation.
             * Card/EFT is selected when the client chooses to pay.
             */
            var payment =
                new Payment(
                    (decimal)package.MonthlyPremium,
                    policy.PolicyId,
                    nextDueDate);

            _context.Payment.Add(
                payment);

            _context.SaveChanges();

            return payment;
        }

        public void GenerateMonthlyPaymentsForAllPolicies()
        {
            var activePolicies =
                _context.Policy
                    .Include(policy => policy.Package)
                    .Where(policy =>
                        policy.Status == PolicyStatus.Active)
                    .ToList();

            var today =
                DateTime.UtcNow.Date;

            foreach (
                var policy
                in activePolicies)
            {
                GenerateMissingPaymentPeriods(
                    policy,
                    today);
            }

            _context.SaveChanges();
        }

        private void GenerateMissingPaymentPeriods(
            Policy policy,
            DateTime today)
        {
            var package =
                GetRequiredPackage(
                    policy);

            var paymentNumber =
                1;

            while (true)
            {
                var dueDate =
                    CalculatePaymentDueDate(
                        policy.StartDate,
                        paymentNumber);

                if (policy.EndDate.HasValue &&
                    dueDate.Date >
                    policy.EndDate.Value.Date)
                {
                    break;
                }

                var existingPayment =
                    FindPaymentForDueDate(
                        policy.PolicyId,
                        dueDate);

                if (existingPayment == null)
                {
                    /*
                     * Generated premiums remain PENDING and have
                     * no payment method until the client pays.
                     */
                    var payment =
                        new Payment(
                            (decimal)package.MonthlyPremium,
                            policy.PolicyId,
                            dueDate);

                    _context.Payment.Add(
                        payment);
                }

                /*
                 * Historical periods are generated through today.
                 * One next/upcoming premium is also generated.
                 */
                if (dueDate.Date > today)
                {
                    break;
                }

                paymentNumber++;
            }
        }

        private DateTime CalculateNextPaymentDueDate(
            Policy policy)
        {
            var existingDueDates =
                _context.Payment
                    .AsNoTracking()
                    .Where(payment =>
                        payment.PolicyId ==
                        policy.PolicyId)
                    .Select(payment =>
                        payment.DueDate)
                    .ToList();

            var paymentNumber =
                1;

            while (true)
            {
                var dueDate =
                    CalculatePaymentDueDate(
                        policy.StartDate,
                        paymentNumber);

                var exists =
                    existingDueDates.Any(
                        existingDueDate =>
                            existingDueDate.Date ==
                            dueDate.Date);

                if (!exists)
                {
                    if (policy.EndDate.HasValue &&
                        dueDate.Date >
                        policy.EndDate.Value.Date)
                    {
                        throw new InvalidOperationException(
                            "This policy has no further payment periods.");
                    }

                    return dueDate;
                }

                paymentNumber++;
            }
        }

        private static DateTime CalculatePaymentDueDate(
            DateTime policyStartDate,
            int paymentNumber)
        {
            return Payment.CalculateDueDate(
                policyStartDate,
                paymentNumber);
        }

        private Payment? FindPaymentForDueDate(
            string policyId,
            DateTime dueDate)
        {
            var start =
                dueDate.Date;

            var end =
                start.AddDays(1);

            return _context.Payment
                .FirstOrDefault(payment =>
                    payment.PolicyId == policyId &&
                    payment.DueDate >= start &&
                    payment.DueDate < end);
        }

        private Policy GetOwnedActivePolicy(
            string policyId,
            string userId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            var policy =
                _context.Policy
                    .Include(item => item.Package)
                    .FirstOrDefault(item =>
                        item.PolicyId == policyId &&
                        item.UserId == userId);

            if (policy == null)
            {
                throw new KeyNotFoundException(
                    "Policy not found.");
            }

            if (policy.Status != PolicyStatus.Active)
            {
                throw new InvalidOperationException(
                    "Payments can only be made for active policies.");
            }

            GetRequiredPackage(
                policy);

            return policy;
        }

        private static Package GetRequiredPackage(
            Policy policy)
        {
            if (policy.Package == null)
            {
                throw new InvalidOperationException(
                    "Policy package information was not found.");
            }

            if (policy.Package.MonthlyPremium <= 0)
            {
                throw new InvalidOperationException(
                    "The policy package has an invalid monthly premium.");
            }

            return policy.Package;
        }

        private static void ValidatePaymentForConfirmation(
            Payment payment,
            string userId)
        {
            if (payment.Amount <= 0)
            {
                throw new InvalidOperationException(
                    "Invalid payment amount.");
            }

            if (payment.Policy == null)
            {
                throw new InvalidOperationException(
                    "Policy information not found.");
            }

            if (payment.Policy.UserId != userId)
            {
                throw new InvalidOperationException(
                    "This payment does not belong to the current client.");
            }

            if (payment.Policy.Status != PolicyStatus.Active)
            {
                throw new InvalidOperationException(
                    "Payments can only be made for active policies.");
            }
        }

        private static void ValidateOnlinePaymentMethod(
            PaymentMethodType method)
        {
            if (method == PaymentMethodType.CASH)
            {
                throw new InvalidOperationException(
                    "Cash payments are not supported. Please use Card or EFT.");
            }

            if (method != PaymentMethodType.CARD &&
                method != PaymentMethodType.EFT)
            {
                throw new InvalidOperationException(
                    "Only Card and EFT payments are supported.");
            }
        }

        private static void ValidateUserId(
            string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(userId));
            }
        }

        private static bool ContainsIgnoreCase(
            string? value,
            string keyword)
        {
            return !string.IsNullOrWhiteSpace(value) &&
                   value.Contains(
                       keyword,
                       StringComparison.OrdinalIgnoreCase);
        }
    }
}


// ============================================================
// RESULTING PAYMENT RULES
// ============================================================
//
// PaymentStatus:
//
// 0 = PENDING
// 1 = SUCCESSFUL
// 2 = FAILED
//
//
// PaymentMethod:
//
// null = client has not selected a method yet
// 0    = CASH -> REJECTED
// 1    = CARD
// 2    = EFT
//
//
// Overdue:
//
// Status == PENDING
// AND
// DueDate < today's UTC date
//
//
// FAILED is NOT Overdue.
//
//
// Monthly due dates:
//
// StartDate.AddMonths(1)
// StartDate.AddMonths(2)
// StartDate.AddMonths(3)
// ...
//
//
// Example:
//
// Policy StartDate:
// 2026-04-10
//
// Premium:
// R850
//
// Records:
//
// 2026-05-10  R850  PENDING  Method=null
// 2026-06-10  R850  PENDING  Method=null
// 2026-07-10  R850  PENDING  Method=null
// 2026-08-10  R850  PENDING  Method=null
// 2026-09-10  R850  PENDING  Method=null
//
//
// Client clicks Pay Now:
//
// CARD:
// Method = CARD
// -> card screen/process
// -> ConfirmPayment()
// -> SUCCESSFUL
//
//
// EFT:
// Method = EFT
// -> EFT screen/process
// -> ConfirmPayment()
// -> SUCCESSFUL
//
//
// CASH:
// rejected
//
//
// ============================================================
// AFTER REPLACING THIS FILE
// ============================================================
//
// PowerShell:
//
// cd "C:\MAIN PROJECT\OOPS\OOPS\legacycare_backend\legacycare_backend"
//
// dotnet build
//
//
// If build succeeds, and Method is now nullable in Payment.cs:
//
// dotnet ef migrations add UpdatePaymentScheduleAndNullableMethod
//
// dotnet ef database update
//
//
// ============================================================
// TO SEE WHAT YOU CURRENTLY HAVE IN SQL
// ============================================================
//
// Run this first in Azure SQL / SSMS:
//
// SELECT
//     TABLE_SCHEMA,
//     TABLE_NAME
// FROM INFORMATION_SCHEMA.TABLES
// WHERE TABLE_NAME LIKE '%Payment%';
//
//
// If the table is dbo.Payment:
//
// SELECT
//     PaymentId,
//     PolicyId,
//     Amount,
//     DueDate,
//     PaymentDate,
//     Status,
//     Method
// FROM dbo.Payment
// ORDER BY DueDate DESC;
//
//
// Human-readable:
//
// SELECT
//     PaymentId,
//     PolicyId,
//     Amount,
//     DueDate,
//     PaymentDate,
//
//     CASE Status
//         WHEN 0 THEN 'PENDING'
//         WHEN 1 THEN 'SUCCESSFUL'
//         WHEN 2 THEN 'FAILED'
//         ELSE 'UNKNOWN'
//     END AS PaymentStatus,
//
//     CASE
//         WHEN Method IS NULL THEN 'NOT SELECTED'
//         WHEN Method = 0 THEN 'CASH'
//         WHEN Method = 1 THEN 'CARD'
//         WHEN Method = 2 THEN 'EFT'
//         ELSE 'UNKNOWN'
//     END AS PaymentMethod
//
// FROM dbo.Payment
// ORDER BY DueDate DESC;
//
//
// ============================================================