using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class ConfirmPaymentRequest
    {
        public PaymentMethodType Method { get; set; }
    }
}