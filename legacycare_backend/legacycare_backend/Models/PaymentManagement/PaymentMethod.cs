using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;
using PolicyManagement.Enums;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Models.PaymentManagement
{
    public class PaymentMethod
    {
        [Key]
        public string PaymentMethodId { get; set; }

        public required PaymentMethodType Method { get; set; }

        public string? AccountReference { get; set; }

        public bool IsDefault { get; set; }

        public required string UserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public PaymentMethod()
        {
            PaymentMethodId = Guid.NewGuid().ToString();
        }

        [SetsRequiredMembers]
        public PaymentMethod(
            PaymentMethodType method,
            string? accountReference,
            bool isDefault,
            string userId)
        {
            PaymentMethodId = Guid.NewGuid().ToString();
            Method = method;
            AccountReference = accountReference;
            IsDefault = isDefault;
            UserId = userId;
        }

        public void SetDefault()
        {
            IsDefault = true;
        }

        public bool ValidateDetails()
        {
            return !string.IsNullOrWhiteSpace(AccountReference);
        }
    }
}