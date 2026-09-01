// File: Service/PaymentManagement/PaymentService.cs

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
        private const int PaymentPeriodDays = 30;

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

            var today = DateTime.UtcNow.Date;

            return _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .Where(payment =>
                    payment.Policy.UserId == userId &&
                    (
                        payment.Status == PaymentStatus.PENDING ||
                        payment.Status == PaymentStatus.FAILED
                    ) &&
                    payment.DueDate.Date <= today)
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
                return GetPaymentsByUser(userId);
            }

            keyword = keyword.Trim().ToLower();

            return _context.Payment
                .AsNoTracking()
                .Include(payment => payment.Policy)
                    .ThenInclude(policy => policy.Package)
                .Where(payment =>
                    payment.Policy.UserId == userId &&
                    (
                        payment.PaymentId
                            .ToLower()
                            .Contains(keyword) ||
                        payment.PolicyId
                            .ToLower()
                            .Contains(keyword) ||
                        payment.Method
                            .ToString()
                            .ToLower()
                            .Contains(keyword) ||
                        payment.Status
                            .ToString()
                            .ToLower()
                            .Contains(keyword)
                    ))
                .OrderByDescending(payment => payment.DueDate)
                .ToList();
        }

        public Payment MakePayment(
            string userId,
            MakePaymentRequest request)
        {
            ValidateUserId(userId);

            var policy = GetOwnedActivePolicy(
                request.PolicyId,
                userId);

            var package = GetRequiredPackage(policy);

            var existingOutstandingPayment =
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

            if (existingOutstandingPayment != null)
            {
                existingOutstandingPayment.Method =
                    request.Method;

                return existingOutstandingPayment;
            }

            var nextDueDate =
                CalculateNextPaymentDueDate(
                    policy);

            var payment = new Payment(
                (decimal)package.MonthlyPremium,
                request.Method,
                policy.PolicyId,
                nextDueDate);

            _context.Payment.Add(payment);
            _context.SaveChanges();

            return payment;
        }

        public Payment ConfirmPayment(
            string paymentId,
            string userId,
            PaymentMethodType method)
        {
            ValidateUserId(userId);

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

            if (
                payment.Status != PaymentStatus.PENDING &&
                payment.Status != PaymentStatus.FAILED)
            {
                throw new InvalidOperationException(
                    $"Payment has already been {payment.Status.ToString().ToLower()}.");
            }

            ValidatePayment(
                payment,
                userId,
                method);

            if (payment.Status == PaymentStatus.FAILED)
            {
                payment.MarkPending();
            }

            payment.Method = method;
            payment.MarkSuccessful();

            _context.SaveChanges();

            return payment;
        }

        public Payment CreateMonthlyPayment(
            string policyId,
            string userId)
        {
            ValidateUserId(userId);

            var policy = GetOwnedActivePolicy(
                policyId,
                userId);

            var package = GetRequiredPackage(policy);

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

            var payment = new Payment(
                (decimal)package.MonthlyPremium,
                PaymentMethodType.CARD,
                policy.PolicyId,
                nextDueDate);

            _context.Payment.Add(payment);
            _context.SaveChanges();

            return payment;
        }

        public void GenerateMonthlyPaymentsForAllPolicies()
        {
            var activePolicies = _context.Policy
                .Include(policy => policy.Package)
                .Where(policy =>
                    policy.Status == PolicyStatus.Active)
                .ToList();

            var today = DateTime.UtcNow.Date;

            foreach (var policy in activePolicies)
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
            var package = GetRequiredPackage(policy);

            var paymentNumber = 1;

            while (true)
            {
                var dueDate =
                    CalculatePaymentDueDate(
                        policy.StartDate,
                        paymentNumber);

                if (dueDate > today)
                {
                    break;
                }

                if (
                    policy.EndDate.HasValue &&
                    dueDate > policy.EndDate.Value.Date)
                {
                    break;
                }

                var existingPayment =
                    FindPaymentForDueDate(
                        policy.PolicyId,
                        dueDate);

                if (existingPayment == null)
                {
                    var payment = new Payment(
                        (decimal)package.MonthlyPremium,
                        PaymentMethodType.CARD,
                        policy.PolicyId,
                        dueDate);

                    _context.Payment.Add(payment);
                }

                paymentNumber++;
            }
        }

        private DateTime CalculateNextPaymentDueDate(
            Policy policy)
        {
            var existingDueDates =
                _context.Payment
                    .Where(payment =>
                        payment.PolicyId == policy.PolicyId)
                    .Select(payment =>
                        payment.DueDate)
                    .ToList();

            var paymentNumber = 1;

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
                    if (
                        policy.EndDate.HasValue &&
                        dueDate >
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
            if (paymentNumber < 1)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(paymentNumber),
                    "Payment number must be at least 1.");
            }

            return policyStartDate
                .Date
                .AddDays(
                    PaymentPeriodDays *
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

            var policy = _context.Policy
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

            GetRequiredPackage(policy);

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

            return policy.Package;
        }

        private void ValidatePayment(
            Payment payment,
            string userId,
            PaymentMethodType method)
        {
            if (payment.Amount <= 0)
            {
                throw new InvalidOperationException(
                    "Invalid payment amount.");
            }

            var paymentMethod =
                _context.PaymentMethod
                    .FirstOrDefault(item =>
                        item.UserId == userId &&
                        item.Method == method);

            if (paymentMethod == null)
            {
                throw new InvalidOperationException(
                    "No payment method found. Please add a payment method.");
            }

            if (payment.Policy == null)
            {
                throw new InvalidOperationException(
                    "Policy information not found.");
            }

            if (
                payment.Policy.Status !=
                PolicyStatus.Active)
            {
                throw new InvalidOperationException(
                    "Payments can only be made for active policies.");
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
    }
}