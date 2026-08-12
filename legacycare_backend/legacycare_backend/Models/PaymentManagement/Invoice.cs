using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.PaymentManagement
{
    public class Invoice
    {
        [Key]
        public string InvoiceId { get; set; }
        public string InvoiceRef { get; set; } = string.Empty;

        public DateOnly InvoiceDate { get; set; }

        public string PdfPath { get; set; } = string.Empty;

        public string PaymentId { get; set; }

        [ForeignKey(nameof(PaymentId))]
        public Payment? Payment { get; set; }

        public string UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public Invoice()
        {
            InvoiceId = Guid.NewGuid().ToString();
            InvoiceDate = DateOnly.FromDateTime(DateTime.Now);
        }

        [SetsRequiredMembers]
        public Invoice(string invoiceRef, string paymentId, string userId, string pdfPath)
        {
            InvoiceId = Guid.NewGuid().ToString();
            InvoiceRef = invoiceRef;
            PaymentId = paymentId;
            UserId = userId;
            PdfPath = pdfPath;
            InvoiceDate = DateOnly.FromDateTime(DateTime.Now);
        }

        public void GeneratePDF()
        {
        }

        public FileInfo Download()
        {
            return new FileInfo(PdfPath);
        }
    }
}