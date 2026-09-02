using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Responses
{
    public class PaymentInvoiceResponse
    {
        public string PaymentId { get; set; } = string.Empty;

        public string InvoiceReference { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime DueDate { get; set; }

        public DateTime? PaymentDate { get; set; }

        public PaymentMethodType? Method { get; set; }

        public PaymentStatus Status { get; set; }

        public string PolicyId { get; set; } = string.Empty;

        public string PolicyNumber { get; set; } = string.Empty;

        public string PackageName { get; set; } = string.Empty;

        public string PolicyStatus { get; set; } = string.Empty;

        public string ClientId { get; set; } = string.Empty;

        public string DisplayClientId { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string CellNo { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
    }
}