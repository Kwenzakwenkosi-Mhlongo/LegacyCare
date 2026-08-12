using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class MakePaymentRequest
    {
        public decimal Amount { get; set; }

        public PaymentMethodType Method { get; set; }

        public string PolicyId { get; set; }
    }
}