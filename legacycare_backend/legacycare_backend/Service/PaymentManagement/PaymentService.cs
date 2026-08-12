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

        public PaymentService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Payment> GetAllPayments()
        {
            return _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .ToList();
        }

        public IEnumerable<Payment> GetPaymentsByUser(string userId)
        {
            return _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .Where(p => p.Policy.UserId == userId)
                .ToList();
        }

        public IEnumerable<Payment> GetPaymentHistory(string userId)
        {
            return _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .Where(p =>
                    p.Policy.UserId == userId &&
                    p.Status == PaymentStatus.SUCCESSFUL)
                .ToList();
        }

        public Payment GetPaymentById(string paymentId, string userId)
        {
            var payment = _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .FirstOrDefault(p =>
                    p.PaymentId == paymentId &&
                    p.Policy.UserId == userId);

            if (payment == null)
                throw new KeyNotFoundException("Payment not found.");

            return payment;
        }

        public Payment GetPaymentsByPolicy(string userId, string policyId)
        {
            var payment = _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .FirstOrDefault(p =>
                    p.PolicyId == policyId &&
                    p.Policy.UserId == userId);

            if (payment == null)
                throw new KeyNotFoundException("Payment not found.");

            return payment;
        }

        public IEnumerable<Payment> GetOutstandingPayments(string userId)
        {
            var today = DateTime.Today;
            return _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .Where(p =>
                    p.Policy.UserId == userId &&
                    (p.Status == PaymentStatus.PENDING || p.Status == PaymentStatus.FAILED) &&
                    p.DueDate <= today.AddDays(30))
                .ToList();
        }

        public IEnumerable<Payment> SearchPayments(string userId, string keyword)
        {
            keyword = keyword.ToLower();

            return _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .Where(p =>
                    p.Policy.UserId == userId &&
                    (
                        p.PaymentId.ToLower().Contains(keyword) ||
                        p.Method.ToString().ToLower().Contains(keyword) ||
                        p.Status.ToString().ToLower().Contains(keyword)
                    ))
                .ToList();
        }

        public Payment MakePayment(string userId, MakePaymentRequest request)
        {
            var policy = _context.Policy
                .Include(p => p.Package)
                .FirstOrDefault(p =>
                    p.PolicyId == request.PolicyId &&
                    p.UserId == userId);

            if (policy == null)
                throw new KeyNotFoundException("Policy not found.");

            var dueDate = policy.StartDate.AddMonths(1);

            var payment = new Payment(
                (decimal)policy.Package.MonthlyPremium,
                request.Method,
                request.PolicyId,
                dueDate
            );

            _context.Payment.Add(payment);
            _context.SaveChanges();

            return payment;
        }

        public Payment ConfirmPayment(string paymentId, string userId, PaymentMethodType method)
        {
            var payment = _context.Payment
                .Include(p => p.Policy)
                    .ThenInclude(p => p.Package)
                .FirstOrDefault(p =>
                    p.PaymentId == paymentId &&
                    p.Policy.UserId == userId);

            if (payment == null)
                throw new KeyNotFoundException("Payment not found.");

            if (payment.Status != PaymentStatus.PENDING && payment.Status != PaymentStatus.FAILED)
            {
                throw new InvalidOperationException(
                    $"Payment has already been {payment.Status.ToString().ToLower()}.");
            }

            if (payment.Status == PaymentStatus.FAILED)
            {
                payment.MarkPending();
            }

            ValidatePayment(payment, userId, method);

            payment.Method = method;
            payment.MarkSuccessful();

            _context.SaveChanges();

            return payment;
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

            var paymentMethod = _context.PaymentMethod
                .FirstOrDefault(pm =>
                    pm.UserId == userId &&
                    pm.Method == method);

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

            if (payment.Policy.Status != PolicyStatus.Active)
            {
                throw new InvalidOperationException(
                    "Payments can only be made for active policies.");
            }
        }

        public Payment CreateMonthlyPayment(
            string policyId,
            string userId)
        {
            var policy = _context.Policy
                .Include(p => p.Package)
                .FirstOrDefault(p =>
                    p.PolicyId == policyId &&
                    p.UserId == userId);

            if (policy == null)
                throw new KeyNotFoundException("Policy not found.");

            var nextDueDate = CalculateNextDueDate(policy);

            var existingPayment = _context.Payment
                .FirstOrDefault(p =>
                    p.PolicyId == policyId &&
                    p.DueDate.Year == nextDueDate.Year &&
                    p.DueDate.Month == nextDueDate.Month);

            if (existingPayment != null)
            {
                throw new InvalidOperationException(
                    "Payment already exists for this month.");
            }

            var payment = new Payment(
                (decimal)policy.Package.MonthlyPremium,
                PaymentMethodType.CARD,
                policyId,
                nextDueDate);

            _context.Payment.Add(payment);
            _context.SaveChanges();

            return payment;
        }

        public void GenerateMonthlyPaymentsForAllPolicies()
        {
            var policies = _context.Policy
                .Include(p => p.Package)
                .Where(p => p.Status == PolicyStatus.Active)
                .ToList();

            foreach (var policy in policies)
            {
                var nextDueDate = CalculateNextDueDate(policy);

                var existingPayment = _context.Payment
                    .FirstOrDefault(p =>
                        p.PolicyId == policy.PolicyId &&
                        p.DueDate.Year == nextDueDate.Year &&
                        p.DueDate.Month == nextDueDate.Month);

                if (existingPayment == null)
                {
                    var payment = new Payment(
                        (decimal)policy.Package.MonthlyPremium,
                        PaymentMethodType.CARD,
                        policy.PolicyId,
                        nextDueDate);

                    _context.Payment.Add(payment);
                }
            }

            _context.SaveChanges();
        }

        private DateTime CalculateNextDueDate(Policy policy)
        {
            var startDate = policy.StartDate;
            var today = DateTime.Today;
            var nextDue = startDate.AddMonths(1);

            while (nextDue <= today)
            {
                nextDue = nextDue.AddMonths(1);
            }

            return nextDue;
        }
    }
}