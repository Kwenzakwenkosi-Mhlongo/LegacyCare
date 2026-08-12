using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.PaymentManagement;

namespace PolicyManagement.Service.PaymentManagement
{
    public class PaymentMethodService : IPaymentMethodService
    {
        private readonly AppDbContext _context;

        public PaymentMethodService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<PaymentMethod> GetAllPaymentMethods(string userId)
        {
            return _context.PaymentMethod
                .Where(pm => pm.UserId == userId)
                .ToList();
        }

        public PaymentMethod GetPaymentMethodById(string userId, string paymentMethodId)
        {
            var paymentMethod = _context.PaymentMethod.FirstOrDefault(pm =>
                pm.PaymentMethodId == paymentMethodId &&
                pm.UserId == userId);

            if (paymentMethod == null)
                throw new KeyNotFoundException("Payment method not found.");

            return paymentMethod;
        }

        public PaymentMethod AddPaymentMethod(string userId, AddPaymentMethodRequest request)
        {
            if (request.IsDefault)
            {
                foreach (var method in _context.PaymentMethod.Where(pm => pm.UserId == userId))
                {
                    method.IsDefault = false;
                }
            }

            var paymentMethod = new PaymentMethod(
                request.Method,
                request.AccountReference,
                request.IsDefault,
                userId);

            if (!paymentMethod.ValidateDetails())
                throw new Exception("Invalid payment method details.");

            _context.PaymentMethod.Add(paymentMethod);
            _context.SaveChanges();

            return paymentMethod;
        }

        public PaymentMethod UpdatePaymentMethod(string userId, string paymentMethodId, UpdatePaymentMethodRequest request)
        {
            var paymentMethod = _context.PaymentMethod.FirstOrDefault(pm =>
                pm.PaymentMethodId == paymentMethodId &&
                pm.UserId == userId);

            if (paymentMethod == null)
                throw new KeyNotFoundException("Payment method not found.");

            if (request.IsDefault)
            {
                foreach (var method in _context.PaymentMethod.Where(pm => pm.UserId == userId))
                {
                    method.IsDefault = false;
                }
            }

            paymentMethod.Method = request.Method;
            paymentMethod.AccountReference = request.AccountReference;
            paymentMethod.IsDefault = request.IsDefault;

            if (!paymentMethod.ValidateDetails())
                throw new Exception("Invalid payment method details.");

            _context.SaveChanges();

            return paymentMethod;
        }

        public void DeletePaymentMethod(string userId, string paymentMethodId)
        {
            var paymentMethod = GetPaymentMethodById(userId, paymentMethodId);

            _context.PaymentMethod.Remove(paymentMethod);
            _context.SaveChanges();
        }
    }
}