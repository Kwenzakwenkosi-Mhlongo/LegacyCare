// ============================================================================
// FILE: Service/MortuaryManagement/IRequestNumberService.cs
// ============================================================================

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IRequestNumberService
    {
        Task<string> GenerateDeathNotificationRequestNumberAsync(
            CancellationToken cancellationToken = default);
    }
}