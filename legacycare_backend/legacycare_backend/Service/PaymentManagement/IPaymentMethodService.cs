using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.PaymentManagement;

namespace PolicyManagement.Service.PaymentManagement
{
    public interface IPaymentMethodService
    {
        IEnumerable<PaymentMethod> GetAllPaymentMethods(string userId);

        PaymentMethod GetPaymentMethodById(string userId, string paymentMethodId);

        PaymentMethod AddPaymentMethod(string userId, AddPaymentMethodRequest request);

        PaymentMethod UpdatePaymentMethod(string userId, string paymentMethodId, UpdatePaymentMethodRequest request);

        void DeletePaymentMethod(string userId, string paymentMethodId);
    }
}