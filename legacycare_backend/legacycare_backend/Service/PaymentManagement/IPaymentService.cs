// ============================================================
// File: Service/PaymentManagement/IPaymentService.cs
// ============================================================

using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models.PaymentManagement;

namespace PolicyManagement.Service.PaymentManagement
{
    public interface IPaymentService
    {
        IEnumerable<Payment> GetPaymentsByUser(string userId);

        IEnumerable<Payment> GetAllPayments();

        IEnumerable<Payment> GetPaymentHistory(string userId);

        Payment GetPaymentById(
            string paymentId,
            string userId);

        IEnumerable<Payment> GetPaymentsByPolicy(
            string userId,
            string policyId);

        IEnumerable<Payment> GetOutstandingPayments(
            string userId);

        IEnumerable<Payment> SearchPayments(
            string userId,
            string keyword);

        Payment MakePayment(
            string userId,
            MakePaymentRequest request);

        Payment ConfirmPayment(
            string paymentId,
            string userId,
            PaymentMethodType method);

        Payment CreateMonthlyPayment(
            string policyId,
            string userId);

        void GenerateMonthlyPaymentsForAllPolicies();
    }
}

