namespace PolicyManagement.Services
{
    public interface IEmailService
    {
        Task SendPasswordSetupEmailAsync(
            string recipientEmail,
            string recipientName,
            string setupLink);
    }
}