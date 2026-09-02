using PolicyManagement.Enums;

namespace PolicyManagement.DTOs.Requests
{
    public class SelectPaymentMethodRequest
    {
        public PaymentMethodType Method { get; set; }
    }
}