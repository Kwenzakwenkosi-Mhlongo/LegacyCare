using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class AddPaymentMethodRequest
    {
        public PaymentMethodType Method { get; set; }

        public string AccountReference { get; set; } = string.Empty;

        public bool IsDefault { get; set; }
    }
}