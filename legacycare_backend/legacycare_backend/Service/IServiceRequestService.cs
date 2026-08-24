using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models;

namespace PolicyManagement.Service.ServiceRequestManagement
{
    public interface IServiceRequestService
    {
        // ============================================================
        // GET ALL
        // ============================================================

        IEnumerable<ServiceRequest> GetAll();

        // ============================================================
        // GET BY CLIENT
        // ============================================================

        IEnumerable<ServiceRequest> GetByClient(string clientId);

        // ============================================================
        // GET BY ID
        // ============================================================

        ServiceRequest? GetById(int id);

        // ============================================================
        // UPDATE
        //
        // Used for:
        // 1. Appointment
        // 2. Funeral
        //
        // Both are editable only when more than 24 hours remain.
        // ============================================================

        ServiceRequest Update(
            int id,
            string clientId,
            UpdateServiceRequestDto request);

        // ============================================================
        // DELETE
        // ============================================================

        void Delete(
            int id,
            string clientId);
    }
}