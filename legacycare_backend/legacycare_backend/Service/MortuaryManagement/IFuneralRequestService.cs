using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IFuneralRequestService
    {
        FuneralRequest Create(
            string userId,
            CreateFuneralRequestRequest request);

        IEnumerable<FuneralRequest>
            GetByClientUserId(string userId);

        FuneralRequest?
            GetById(string funeralRequestId);

        IEnumerable<FuneralRequest>
            GetPendingRequests();

        FuneralRequest Review(
            string clerkUserId,
            string funeralRequestId,
            ReviewFuneralRequestRequest request);
    }
}