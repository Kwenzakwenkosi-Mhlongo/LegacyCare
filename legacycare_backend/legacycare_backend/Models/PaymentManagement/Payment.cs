// File: Models/PaymentManagement/Payment.cs

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PolicyManagement.Enums;

namespace PolicyManagement.Models.PaymentManagement
{
    public class Payment
    {
        private const int PaymentPeriodDays = 30;

        [Key]
        public string PaymentId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime? PaymentDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public PaymentMethodType Method { get; set; }

        [Required]
        public PaymentStatus Status { get; set; }

        [Required]
        public string PolicyId { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy Policy { get; set; } = null!;

        public Payment()
        {
            PaymentId = Guid.NewGuid().ToString();
            Status = PaymentStatus.PENDING;
            PaymentDate = null;
            DueDate = DateTime.UtcNow.AddDays(PaymentPeriodDays);
            PolicyId = string.Empty;
        }

        public Payment(
            decimal amount,
            PaymentMethodType method,
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

            PaymentId = Guid.NewGuid().ToString();
            Amount = amount;
            Method = method;
            PolicyId = policyId;
            DueDate = dueDate;
            Status = PaymentStatus.PENDING;
            PaymentDate = null;
        }

        public bool ProcessPayment()
        {
            MarkSuccessful();
            return true;
        }

        public void MarkPending()
        {
            Status = PaymentStatus.PENDING;
            PaymentDate = null;
        }

        public void MarkSuccessful()
        {
            Status = PaymentStatus.SUCCESSFUL;
            PaymentDate = DateTime.UtcNow;
        }

        public void MarkFailed()
        {
            Status = PaymentStatus.FAILED;
            PaymentDate = null;
        }

        public bool IsSuccessful()
        {
            return Status == PaymentStatus.SUCCESSFUL;
        }

        public bool IsOverdue()
        {
            return Status == PaymentStatus.PENDING &&
                   DueDate < DateTime.UtcNow;
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

            return policyStartDate
                .ToUniversalTime()
                .AddDays(PaymentPeriodDays * paymentNumber);
        }
    }
}