// File:
// legacycare_backend/legacycare_backend/
// Models/PaymentManagement/Payment.cs

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;

namespace PolicyManagement.Models.PaymentManagement
{
    public class Payment
    {
        [Key]
        public string PaymentId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime? PaymentDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public PaymentMethodType? Method { get; set; }

        [Required]
        public PaymentStatus Status { get; set; }

        [Required]
        public string PolicyId { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy Policy { get; set; } = null!;

        public Payment()
        {
            PaymentId = Guid.NewGuid().ToString();
            Amount = 0m;
            PaymentDate = null;
            DueDate = DateTime.UtcNow;
            Method = null;
            Status = PaymentStatus.PENDING;
            PolicyId = string.Empty;
        }

        /// <summary>
        /// Creates a scheduled premium before the client chooses
        /// Card or EFT.
        /// </summary>
        public Payment(
            decimal amount,
            string policyId,
            DateTime dueDate)
        {
            ValidatePaymentDetails(
                amount,
                policyId,
                dueDate);

            PaymentId = Guid.NewGuid().ToString();
            Amount = amount;
            PolicyId = policyId;
            DueDate = EnsureUtc(dueDate);
            Method = null;
            Status = PaymentStatus.PENDING;
            PaymentDate = null;
        }

        /// <summary>
        /// Backward-compatible constructor used by the existing
        /// PaymentService when a payment method is already known.
        /// </summary>
        public Payment(
            decimal amount,
            PaymentMethodType method,
            string policyId,
            DateTime dueDate)
        {
            ValidatePaymentDetails(
                amount,
                policyId,
                dueDate);

            ValidateOnlineMethod(method);

            PaymentId = Guid.NewGuid().ToString();
            Amount = amount;
            PolicyId = policyId;
            DueDate = EnsureUtc(dueDate);
            Method = method;
            Status = PaymentStatus.PENDING;
            PaymentDate = null;
        }

        public bool ProcessPayment()
        {
            MarkSuccessful();
            return true;
        }

        public void SelectPaymentMethod(
            PaymentMethodType method)
        {
            ValidateOnlineMethod(method);

            Method = method;
        }

        public void MarkPending()
        {
            Status = PaymentStatus.PENDING;
            PaymentDate = null;
        }

        /// <summary>
        /// Used when PaymentService has already selected a payment method.
        /// </summary>
        public void MarkSuccessful()
        {
            if (!Method.HasValue)
            {
                throw new InvalidOperationException(
                    "A payment method must be selected before confirming payment.");
            }

            ValidateOnlineMethod(
                Method.Value);

            Status = PaymentStatus.SUCCESSFUL;
            PaymentDate = DateTime.UtcNow;
        }

        public void MarkSuccessful(
            PaymentMethodType method)
        {
            SelectPaymentMethod(method);

            Status = PaymentStatus.SUCCESSFUL;
            PaymentDate = DateTime.UtcNow;
        }

        public void MarkFailed()
        {
            Status = PaymentStatus.FAILED;
            PaymentDate = null;
        }

        public void MarkFailed(
            PaymentMethodType method)
        {
            SelectPaymentMethod(method);

            Status = PaymentStatus.FAILED;
            PaymentDate = null;
        }

        public bool IsSuccessful()
        {
            return Status == PaymentStatus.SUCCESSFUL;
        }

        public bool IsPending()
        {
            return Status == PaymentStatus.PENDING;
        }

        public bool IsFailed()
        {
            return Status == PaymentStatus.FAILED;
        }

        public bool IsOverdue()
        {
            return Status == PaymentStatus.PENDING &&
                   DueDate.Date < DateTime.UtcNow.Date;
        }

        public static DateTime CalculateDueDate(
            DateTime policyStartDate,
            int paymentNumber)
        {
            if (paymentNumber < 1)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(paymentNumber),
                    "Payment number must be at least 1.");
            }

            return EnsureUtc(policyStartDate)
                .AddMonths(paymentNumber);
        }

        private static void ValidatePaymentDetails(
            decimal amount,
            string policyId,
            DateTime dueDate)
        {
            if (amount <= 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(amount),
                    "Payment amount must be greater than zero.");
            }

            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }

            if (dueDate == default)
            {
                throw new ArgumentException(
                    "A valid due date is required.",
                    nameof(dueDate));
            }
        }

        private static void ValidateOnlineMethod(
            PaymentMethodType method)
        {
            if (method == PaymentMethodType.CASH)
            {
                throw new InvalidOperationException(
                    "Cash payments are not supported. Use Card or EFT.");
            }

            if (method != PaymentMethodType.CARD &&
                method != PaymentMethodType.EFT)
            {
                throw new InvalidOperationException(
                    "Unsupported payment method.");
            }
        }

        private static DateTime EnsureUtc(
            DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,

                DateTimeKind.Local =>
                    value.ToUniversalTime(),

                _ =>
                    DateTime.SpecifyKind(
                        value,
                        DateTimeKind.Utc)
            };
        }
    }
}