using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace PolicyManagement.Services
{
    public class EmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public EmailService(
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task SendPasswordSetupEmailAsync(
            string recipientEmail,
            string recipientName,
            string setupLink)
        {
            var apiKey = _configuration["RESEND_API_KEY"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException(
                    "RESEND_API_KEY is not configured."
                );
            }

            var email = new
            {
                from = "LegacyCare <onboarding@resend.dev>",
                to = new[] { recipientEmail },
                subject = "LegacyCare - Set Your Password",
                html = $"""
                    <h2>Welcome to LegacyCare</h2>

                    <p>Hello {recipientName},</p>

                    <p>
                        Your LegacyCare account has been created.
                    </p>

                    <p>
                        Click the button below to create your password:
                    </p>

                    <p>
                        <a href="{setupLink}"
                           style="
                           display:inline-block;
                           padding:12px 20px;
                           background:#2563eb;
                           color:white;
                           text-decoration:none;
                           border-radius:6px;">
                           Set Your Password
                        </a>
                    </p>

                    <p>
                        This link expires after 24 hours.
                    </p>

                    <p>
                        Regards,<br>
                        LegacyCare
                    </p>
                    """
            };

            var json = JsonSerializer.Serialize(email);

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://api.resend.com/emails"
            );

            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            request.Content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json"
            );

            using var response = await _httpClient.SendAsync(request);

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception(
                    $"Resend email failed. Status: {response.StatusCode}. Response: {responseBody}"
                );
            }
        }
    }
}