using PolicyManagement.Models.PaymentManagement;

namespace PolicyManagement.Service.PaymentManagement
{
    public interface IInvoiceService
    {
        Invoice GenerateInvoice(string paymentId, string userId);

        Invoice GetInvoiceById(string invoiceId, string userId);

        Invoice GetInvoiceByPaymentId(string paymentId, string userId);

        FileInfo DownloadInvoice(string invoiceId, string userId);

        Invoice GenerateInvoiceFromPayment(string paymentId, string userId);
    }
}