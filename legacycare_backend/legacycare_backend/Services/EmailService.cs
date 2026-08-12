using System.Net;
using System.Net.Mail;

namespace PolicyManagement.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendPasswordSetupEmailAsync(
            string recipientEmail,
            string recipientName,
            string setupLink)
        {
            var smtpHost = _configuration["Email:SmtpHost"];
            var smtpPort = int.Parse(
                _configuration["Email:SmtpPort"] ?? "587"
            );

            var smtpUsername = _configuration["Email:Username"];
            var smtpPassword = _configuration["Email:Password"];
            var fromEmail = _configuration["Email:From"];

            Console.WriteLine("=================================");
            Console.WriteLine("EMAIL SERVICE");
            Console.WriteLine($"SMTP Host: {smtpHost}");
            Console.WriteLine($"SMTP Port: {smtpPort}");
            Console.WriteLine($"Username: {smtpUsername}");
            Console.WriteLine($"Sending To: {recipientEmail}");
            Console.WriteLine($"Setup Link: {setupLink}");
            Console.WriteLine("=================================");

            if (string.IsNullOrWhiteSpace(smtpUsername))
                throw new Exception("Email username is missing.");

            if (string.IsNullOrWhiteSpace(smtpPassword))
                throw new Exception("Email password/app password is missing.");

            if (string.IsNullOrWhiteSpace(smtpHost))
                throw new Exception("SMTP host is missing.");

            using var message = new MailMessage();

            message.From = new MailAddress(
                fromEmail ?? smtpUsername,
                "LegacyCare"
            );

            message.To.Add(recipientEmail);

            message.Subject = "LegacyCare - Set Your Password";

            message.Body = $"""
                Hello {recipientName},

                Your LegacyCare account has been created.

                Please click the link below to set your password:

                {setupLink}

                This link will expire in 24 hours.

                Regards,
                LegacyCare
                """;

            message.IsBodyHtml = false;

            using var smtp = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(
                    smtpUsername,
                    smtpPassword
                )
            };

            try
            {
                await smtp.SendMailAsync(message);

                Console.WriteLine(
                    $"EMAIL SENT SUCCESSFULLY TO: {recipientEmail}"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("=================================");
                Console.WriteLine("EMAIL FAILED");
                Console.WriteLine(ex.ToString());
                Console.WriteLine("=================================");

                throw;
            }
        }
    }
}