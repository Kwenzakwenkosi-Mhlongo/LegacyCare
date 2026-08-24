using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models;

namespace PolicyManagement.Service.ServiceRequestManagement
{
    public class ServiceRequestService : IServiceRequestService
    {
        private readonly AppDbContext _context;

        public ServiceRequestService(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET ALL
        // ============================================================

        public IEnumerable<ServiceRequest> GetAll()
        {
            return _context.ServiceRequests
                .Include(x => x.Branch)
                .Include(x => x.Client)
                .Include(x => x.FuneralRequest)
                .OrderByDescending(x => x.CreatedDate)
                .ToList();
        }

        // ============================================================
        // GET BY CLIENT
        // ============================================================

        public IEnumerable<ServiceRequest> GetByClient(string clientId)
        {
            return _context.ServiceRequests
                .Include(x => x.Branch)
                .Include(x => x.Client)
                .Include(x => x.FuneralRequest)
                .Where(x => x.ClientId == clientId)
                .OrderByDescending(x => x.CreatedDate)
                .ToList();
        }

        // ============================================================
        // GET BY ID
        // ============================================================

        public ServiceRequest? GetById(int id)
        {
            return _context.ServiceRequests
                .Include(x => x.Branch)
                .Include(x => x.Client)
                .Include(x => x.FuneralRequest)
                .FirstOrDefault(x =>
                    x.ServiceRequestId == id);
        }

        // ============================================================
        // UPDATE
        //
        // Editable request types:
        // 1. Appointment
        // 2. Funeral
        //
        // Existing scheduled date/time must be MORE than 24 hours away.
        // ============================================================

        public ServiceRequest Update(
            int id,
            string clientId,
            UpdateServiceRequestDto request)
        {
            var serviceRequest = _context.ServiceRequests
                .Include(x => x.Branch)
                .Include(x => x.Client)
                .Include(x => x.FuneralRequest)
                .FirstOrDefault(x =>
                    x.ServiceRequestId == id &&
                    x.ClientId == clientId);

            if (serviceRequest == null)
            {
                throw new KeyNotFoundException(
                    "Service request was not found.");
            }

            // ========================================================
            // REQUEST TYPE
            // ========================================================

            var requestType =
                (serviceRequest.RequestType ?? "")
                    .Trim()
                    .ToLower();

            var isAppointment =
                requestType == "appointment" ||
                requestType == "appointment request";

            var isFuneral =
                requestType == "funeral" ||
                requestType == "funeral service" ||
                requestType == "funeral request" ||
                requestType == "funeralservice";

            // ========================================================
            // ONLY APPOINTMENT AND FUNERAL
            // ========================================================

            if (!isAppointment && !isFuneral)
            {
                throw new InvalidOperationException(
                    "Only appointment and funeral requests can be edited.");
            }

            // ========================================================
            // STATUS LOCK
            // ========================================================

            var status =
                (serviceRequest.Status ?? "")
                    .Trim()
                    .ToLower();

            if (
                status == "completed" ||
                status == "rejected" ||
                status == "cancelled")
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "This funeral request cannot be changed because its status does not allow editing."
                        : "This appointment cannot be changed because its status does not allow editing.");
            }

            // ========================================================
            // NEW DATE/TIME REQUIRED
            // ========================================================

            if (!request.AppointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "Funeral date and time are required."
                        : "Appointment date and time are required.");
            }

            var newDateTime =
                request.AppointmentDateTime.Value;

            // ========================================================
            // NEW DATE MUST BE FUTURE
            // ========================================================

            if (newDateTime <= DateTime.Now)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "Funeral date and time must be in the future."
                        : "Appointment date and time must be in the future.");
            }

            // ========================================================
            // EXISTING DATE/TIME
            //
            // IMPORTANT:
            // The 24-hour rule is based on the EXISTING scheduled
            // date/time.
            //
            // This prevents someone from moving a funeral that is
            // already inside the 24-hour lock period to a later date.
            // ========================================================

            if (!serviceRequest.AppointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "The existing funeral date and time could not be found."
                        : "The existing appointment date and time could not be found.");
            }

            var existingDateTime =
                serviceRequest.AppointmentDateTime.Value;

            var hoursRemaining =
                (existingDateTime - DateTime.Now).TotalHours;

            if (hoursRemaining <= 24)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "This funeral request cannot be changed because 24 hours or less remain before the funeral."
                        : "This appointment cannot be changed because 24 hours or less remain before the appointment.");
            }

            // ========================================================
            // BRANCH
            // ========================================================

            if (!string.IsNullOrWhiteSpace(request.BranchId))
            {
                var branchExists =
                    _context.Branch.Any(x =>
                        x.BranchId == request.BranchId &&
                        x.IsActive);

                if (!branchExists)
                {
                    throw new InvalidOperationException(
                        "The selected branch does not exist or is inactive.");
                }

                serviceRequest.BranchId =
                    request.BranchId.Trim();
            }

            // ========================================================
            // DESCRIPTION
            // ========================================================

            serviceRequest.Description =
                string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim();

            // ========================================================
            // UPDATE DATE/TIME
            // ========================================================

            serviceRequest.AppointmentDateTime =
                newDateTime;

            // ========================================================
            // UPDATED DATE
            // ========================================================

            serviceRequest.UpdatedDate =
                DateTime.Now;

            _context.ServiceRequests.Update(
                serviceRequest);

            _context.SaveChanges();

            return GetById(id)!;
        }

        // ============================================================
        // DELETE
        // ============================================================

        public void Delete(
            int id,
            string clientId)
        {
            var serviceRequest =
                _context.ServiceRequests
                    .FirstOrDefault(x =>
                        x.ServiceRequestId == id &&
                        x.ClientId == clientId);

            if (serviceRequest == null)
            {
                throw new KeyNotFoundException(
                    "Service request was not found.");
            }

            _context.ServiceRequests.Remove(
                serviceRequest);

            _context.SaveChanges();
        }
    }
}