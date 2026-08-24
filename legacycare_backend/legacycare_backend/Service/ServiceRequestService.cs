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
        // CREATE
        //
        // Client creates a new Appointment service request.
        // ============================================================

        public ServiceRequest Create(
            string clientId,
            CreateServiceRequestRequest request)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new UnauthorizedAccessException(
                    "Client identity could not be determined."
                );
            }

            if (request == null)
            {
                throw new ArgumentNullException(
                    nameof(request)
                );
            }

            // ========================================================
            // REQUEST TYPE
            // ========================================================

            var requestType =
                (request.RequestType ?? "")
                    .Trim();

            if (string.IsNullOrWhiteSpace(requestType))
            {
                throw new InvalidOperationException(
                    "Request type is required."
                );
            }

            var normalizedType =
                requestType.ToLower();

            var isAppointment =
                normalizedType == "appointment" ||
                normalizedType == "appointment request";

            if (!isAppointment)
            {
                throw new InvalidOperationException(
                    "Only appointment requests can be created through this endpoint."
                );
            }

            // ========================================================
            // DATE / TIME
            // ========================================================

            if (!request.AppointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    "Appointment date and time are required."
                );
            }

            var appointmentDateTime =
                request.AppointmentDateTime.Value;

            if (appointmentDateTime <= DateTime.Now)
            {
                throw new InvalidOperationException(
                    "Appointment date and time must be in the future."
                );
            }

            // ========================================================
            // 24-HOUR RULE
            // ========================================================

            var hoursRemaining =
                (appointmentDateTime - DateTime.Now)
                    .TotalHours;

            if (hoursRemaining <= 24)
            {
                throw new InvalidOperationException(
                    "Appointments must be booked more than 24 hours in advance."
                );
            }

            // ========================================================
            // BRANCH
            // ========================================================

            string? branchId = null;

            if (!string.IsNullOrWhiteSpace(request.BranchId))
            {
                branchId = request.BranchId.Trim();

                var branchExists =
                    _context.Branch.Any(x =>
                        x.BranchId == branchId &&
                        x.IsActive);

                if (!branchExists)
                {
                    throw new InvalidOperationException(
                        "The selected branch does not exist or is inactive."
                    );
                }
            }
            else
            {
                throw new InvalidOperationException(
                    "A preferred branch is required."
                );
            }

            // ========================================================
            // PRIORITY
            // ========================================================

            var priority =
                string.IsNullOrWhiteSpace(request.Priority)
                    ? "Normal"
                    : request.Priority.Trim();

            if (
                !priority.Equals(
                    "Normal",
                    StringComparison.OrdinalIgnoreCase
                )
                &&
                !priority.Equals(
                    "High",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                throw new InvalidOperationException(
                    "Invalid request priority."
                );
            }

            // ========================================================
            // HIGH PRIORITY FEE
            // ========================================================

            decimal additionalFee = 0;

            if (
                priority.Equals(
                    "High",
                    StringComparison.OrdinalIgnoreCase
                )
            )
            {
                if (!request.AcceptPriorityFee)
                {
                    throw new InvalidOperationException(
                        "Please accept the R100.00 High Priority service fee."
                    );
                }

                additionalFee = 100;
            }

            // ========================================================
            // DESCRIPTION
            // ========================================================

            var description =
                string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim();

            // ========================================================
            // CREATE ENTITY
            // ========================================================

            var serviceRequest =
                new ServiceRequest
                {
                    ClientId = clientId,

                    BranchId = branchId,

                    RequestType = "Appointment",

                    Status = "Pending",

                    Priority =
                        priority.Equals(
                            "High",
                            StringComparison.OrdinalIgnoreCase
                        )
                            ? "High"
                            : "Normal",

                    Description = description,

                    AppointmentDateTime =
                        appointmentDateTime,

                    AdditionalFee =
                        additionalFee,

                    CreatedDate =
                        DateTime.Now,

                    UpdatedDate = null
                };

            _context.ServiceRequests.Add(
                serviceRequest
            );

            _context.SaveChanges();

            // ========================================================
            // RETURN COMPLETE REQUEST
            // ========================================================

            return GetById(
                serviceRequest.ServiceRequestId
            )!;
        }

        // ============================================================
        // UPDATE
        //
        // Editable:
        // - Appointment
        // - Funeral
        //
        // Existing appointment/funeral must have MORE than 24 hours
        // remaining before it can be changed.
        // ============================================================

        public ServiceRequest Update(
            int id,
            string clientId,
            UpdateServiceRequestDto request)
        {
            var serviceRequest =
                _context.ServiceRequests
                    .Include(x => x.Branch)
                    .Include(x => x.Client)
                    .Include(x => x.FuneralRequest)
                    .FirstOrDefault(x =>
                        x.ServiceRequestId == id &&
                        x.ClientId == clientId);

            if (serviceRequest == null)
            {
                throw new KeyNotFoundException(
                    "Service request was not found."
                );
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

            if (!isAppointment && !isFuneral)
            {
                throw new InvalidOperationException(
                    "Only appointment and funeral requests can be edited."
                );
            }

            // ========================================================
            // STATUS
            // ========================================================

            var status =
                (serviceRequest.Status ?? "")
                    .Trim()
                    .ToLower();

            if (
                status == "completed" ||
                status == "rejected" ||
                status == "cancelled"
            )
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "This funeral request cannot be changed because its status does not allow editing."
                        : "This appointment cannot be changed because its status does not allow editing."
                );
            }

            // ========================================================
            // NEW DATE/TIME
            // ========================================================

            if (!request.AppointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "Funeral date and time are required."
                        : "Appointment date and time are required."
                );
            }

            var newDateTime =
                request.AppointmentDateTime.Value;

            if (newDateTime <= DateTime.Now)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "Funeral date and time must be in the future."
                        : "Appointment date and time must be in the future."
                );
            }

            // ========================================================
            // EXISTING DATE/TIME
            // ========================================================

            if (!serviceRequest.AppointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "The existing funeral date and time could not be found."
                        : "The existing appointment date and time could not be found."
                );
            }

            var existingDateTime =
                serviceRequest.AppointmentDateTime.Value;

            var hoursRemaining =
                (existingDateTime - DateTime.Now)
                    .TotalHours;

            if (hoursRemaining <= 24)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "This funeral request cannot be changed because 24 hours or less remain before the funeral."
                        : "This appointment cannot be changed because 24 hours or less remain before the appointment."
                );
            }

            // ========================================================
            // BRANCH
            // ========================================================

            if (!string.IsNullOrWhiteSpace(request.BranchId))
            {
                var branchId =
                    request.BranchId.Trim();

                var branchExists =
                    _context.Branch.Any(x =>
                        x.BranchId == branchId &&
                        x.IsActive);

                if (!branchExists)
                {
                    throw new InvalidOperationException(
                        "The selected branch does not exist or is inactive."
                    );
                }

                serviceRequest.BranchId =
                    branchId;
            }

            // ========================================================
            // DESCRIPTION
            // ========================================================

            serviceRequest.Description =
                string.IsNullOrWhiteSpace(
                    request.Description
                )
                    ? null
                    : request.Description.Trim();

            // ========================================================
            // DATE/TIME
            // ========================================================

            serviceRequest.AppointmentDateTime =
                newDateTime;

            // ========================================================
            // UPDATED DATE
            // ========================================================

            serviceRequest.UpdatedDate =
                DateTime.Now;

            _context.ServiceRequests.Update(
                serviceRequest
            );

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
                    "Service request was not found."
                );
            }

            _context.ServiceRequests.Remove(
                serviceRequest
            );

            _context.SaveChanges();
        }
    }
}