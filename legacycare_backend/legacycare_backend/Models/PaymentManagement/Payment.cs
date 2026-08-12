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
        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; }

        public DateTime DueDate { get; set; }

        public PaymentMethodType Method { get; set; }

        public PaymentStatus Status { get; set; }

        public string PolicyId { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public virtual Policy Policy { get; set; }

        public Payment()
        {
            PaymentId = Guid.NewGuid().ToString();
            Status = PaymentStatus.PENDING;
            PaymentDate = DateTime.Now;
            DueDate = DateTime.Now.AddMonths(1);
            PolicyId = string.Empty;
        }

        public Payment(decimal amount, PaymentMethodType method, string policyId, DateTime dueDate)
        {
            PaymentId = Guid.NewGuid().ToString();
            Status = PaymentStatus.PENDING;
            PaymentDate = DateTime.Now;
            DueDate = dueDate;
            Amount = amount;
            Method = method;
            PolicyId = policyId;
        }

        public bool ProcessPayment()
        {
            Status = PaymentStatus.SUCCESSFUL;
            PaymentDate = DateTime.Now;
            return true;
        }

        public void MarkPending()
        {
            Status = PaymentStatus.PENDING;
        }

        public void MarkSuccessful()
        {
            Status = PaymentStatus.SUCCESSFUL;
        }

        public void MarkFailed()
        {
            Status = PaymentStatus.FAILED;
        }
    }
}