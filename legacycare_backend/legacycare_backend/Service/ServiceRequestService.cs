// File: Service/ServiceRequestManagement/ServiceRequestService.cs

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
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

        public IEnumerable<ServiceRequest> GetAll()
        {
            return _context.ServiceRequests
                .Include(x => x.Branch)
                .Include(x => x.Client)
                .Include(x => x.FuneralRequest)
                .OrderByDescending(x => x.CreatedDate)
                .ToList();
        }

        public IEnumerable<ServiceRequest> GetByClient(string clientId)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new ArgumentException(
                    "Client ID is required.",
                    nameof(clientId));
            }

            return _context.ServiceRequests
                .Include(x => x.Branch)
                .Include(x => x.Client)
                .Include(x => x.FuneralRequest)
                .Where(x => x.ClientId == clientId)
                .OrderByDescending(x => x.CreatedDate)
                .ToList();
        }

        public ServiceRequest? GetById(int id)
        {
            return _context.ServiceRequests
                .Include(x => x.Branch)
                .Include(x => x.Client)
                .Include(x => x.FuneralRequest)
                .FirstOrDefault(x =>
                    x.ServiceRequestId == id);
        }

        public ServiceRequest Create(
            string clientId,
            CreateServiceRequestRequest request)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new UnauthorizedAccessException(
                    "Client identity could not be determined.");
            }

            ArgumentNullException.ThrowIfNull(request);

            var requestType =
                ResolveRequestType(request.RequestType);

            var priority =
                ResolvePriority(request.Priority);

            var description =
                string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim();

            var branchId =
                ResolveBranch(request.BranchId);

            var additionalFee =
                CalculatePriorityFee(
                    priority,
                    request.AcceptPriorityFee);

            DateTime? appointmentDateTime = null;

            if (requestType == "Appointment")
            {
                appointmentDateTime =
                    ValidateAppointmentDateTime(
                        request.AppointmentDateTime);
            }

            var serviceRequest =
                new ServiceRequest
                {
                    ClientId = clientId,
                    BranchId = branchId,
                    RequestType = requestType,
                    Status = GetInitialStatus(requestType),
                    Priority = priority,
                    Description = description,
                    AppointmentDateTime = appointmentDateTime,
                    AdditionalFee = additionalFee,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = null
                };

            _context.ServiceRequests.Add(serviceRequest);
            _context.SaveChanges();

            return GetById(
                serviceRequest.ServiceRequestId)!;
        }

        public ServiceRequest Update(
            int id,
            string clientId,
            UpdateServiceRequestDto request)
        {
            ArgumentNullException.ThrowIfNull(request);

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
                    "Service request was not found.");
            }

            var normalizedType =
                Normalize(serviceRequest.RequestType);

            var isAppointment =
                normalizedType is
                    "appointment" or
                    "appointmentrequest";

            var isFuneral =
                normalizedType is
                    "funeral" or
                    "funeralservice" or
                    "funeralrequest";

            if (!isAppointment && !isFuneral)
            {
                throw new InvalidOperationException(
                    "Only appointment and funeral date/time requests can be edited through this endpoint.");
            }

            EnsureRequestCanBeEdited(
                serviceRequest,
                isFuneral);

            if (!request.AppointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "Funeral date and time are required."
                        : "Appointment date and time are required.");
            }

            if (!serviceRequest.AppointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "The existing funeral date and time could not be found."
                        : "The existing appointment date and time could not be found.");
            }

            EnsureMoreThanTwentyFourHoursRemain(
                serviceRequest.AppointmentDateTime.Value,
                isFuneral);

            var newDateTime =
                request.AppointmentDateTime.Value;

            if (newDateTime <= DateTime.Now)
            {
                throw new InvalidOperationException(
                    isFuneral
                        ? "Funeral date and time must be in the future."
                        : "Appointment date and time must be in the future.");
            }

            if (!string.IsNullOrWhiteSpace(request.BranchId))
            {
                serviceRequest.BranchId =
                    ResolveBranch(request.BranchId);
            }

            serviceRequest.Description =
                string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim();

            serviceRequest.AppointmentDateTime =
                newDateTime;

            serviceRequest.UpdatedDate =
                DateTime.UtcNow;

            _context.SaveChanges();

            return GetById(id)!;
        }

        public ServiceRequest Review(
            int id,
            ReviewServiceRequestRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (string.IsNullOrWhiteSpace(request.Status))
            {
                throw new InvalidOperationException(
                    "Status is required.");
            }

            var serviceRequest =
                _context.ServiceRequests
                    .Include(x => x.Branch)
                    .Include(x => x.Client)
                    .FirstOrDefault(x =>
                        x.ServiceRequestId == id);

            if (serviceRequest == null)
            {
                throw new KeyNotFoundException(
                    "Service request was not found.");
            }

            var requestType =
                ResolveExistingRequestType(
                    serviceRequest.RequestType);

            if (requestType is
                "DeathNotification" or
                "Funeral" or
                "Appointment")
            {
                throw new InvalidOperationException(
                    $"{requestType} must be managed through its dedicated workflow.");
            }

            var requestedStatus =
                NormalizeStatusForType(
                    requestType,
                    request.Status);

            ValidateStatusTransition(
                requestType,
                serviceRequest.Status,
                requestedStatus);

            serviceRequest.Status =
                requestedStatus;

            serviceRequest.UpdatedDate =
                DateTime.UtcNow;

            _context.SaveChanges();

            return GetById(id)!;
        }

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

            if (!CanClientDelete(serviceRequest))
            {
                throw new InvalidOperationException(
                    "This service request can no longer be deleted.");
            }

            _context.ServiceRequests.Remove(
                serviceRequest);

            _context.SaveChanges();
        }

        private string ResolveRequestType(
            string? requestType)
        {
            if (string.IsNullOrWhiteSpace(requestType))
            {
                throw new InvalidOperationException(
                    "Request type is required.");
            }

            var normalized =
                Normalize(requestType);

            return normalized switch
            {
                "appointment" or
                "appointmentrequest"
                    => "Appointment",

                "quote" or
                "quoterequest"
                    => "Quote",

                "policy" or
                "policyenquiry" or
                "policyinquiry"
                    => "PolicyEnquiry",

                "payment" or
                "paymentenquiry" or
                "paymentinquiry"
                    => "PaymentEnquiry",

                "document" or
                "documents" or
                "documentrequest"
                    => "DocumentRequest",

                "support" or
                "generalsupport" or
                "supportrequest"
                    => "GeneralSupport",

                "death" or
                "deathnotification"
                    => throw new InvalidOperationException(
                        "Death notifications must be created through the Death Notification workflow."),

                "funeral" or
                "funeralrequest" or
                "funeralservice"
                    => throw new InvalidOperationException(
                        "Funeral requests must be created through the Funeral Request workflow."),

                _ => throw new InvalidOperationException(
                    $"Unsupported service request type '{requestType}'.")
            };
        }

        private static string ResolveExistingRequestType(
            string requestType)
        {
            var normalized =
                Normalize(requestType);

            return normalized switch
            {
                "appointment" or
                "appointmentrequest"
                    => "Appointment",

                "quote" or
                "quoterequest"
                    => "Quote",

                "policy" or
                "policyenquiry" or
                "policyinquiry"
                    => "PolicyEnquiry",

                "payment" or
                "paymentenquiry" or
                "paymentinquiry"
                    => "PaymentEnquiry",

                "document" or
                "documents" or
                "documentrequest"
                    => "DocumentRequest",

                "support" or
                "generalsupport" or
                "supportrequest"
                    => "GeneralSupport",

                "death" or
                "deathnotification"
                    => "DeathNotification",

                "funeral" or
                "funeralrequest" or
                "funeralservice"
                    => "Funeral",

                _ => throw new InvalidOperationException(
                    $"Unsupported service request type '{requestType}'.")
            };
        }

        private string ResolveBranch(
            string? branchId)
        {
            if (string.IsNullOrWhiteSpace(branchId))
            {
                throw new InvalidOperationException(
                    "A branch is required.");
            }

            var normalizedBranchId =
                branchId.Trim();

            var branchExists =
                _context.Branch.Any(x =>
                    x.BranchId == normalizedBranchId &&
                    x.IsActive);

            if (!branchExists)
            {
                throw new InvalidOperationException(
                    "The selected branch does not exist or is inactive.");
            }

            return normalizedBranchId;
        }

        private static string ResolvePriority(
            string? priority)
        {
            var normalized =
                Normalize(
                    string.IsNullOrWhiteSpace(priority)
                        ? RequestPriority.Normal.ToString()
                        : priority);

            return normalized switch
            {
                "normal" =>
                    RequestPriority.Normal.ToString(),

                "high" =>
                    RequestPriority.High.ToString(),

                _ => throw new InvalidOperationException(
                    "Priority must be Normal or High.")
            };
        }

        private static decimal CalculatePriorityFee(
            string priority,
            bool acceptedPriorityFee)
        {
            if (!string.Equals(
                priority,
                RequestPriority.High.ToString(),
                StringComparison.OrdinalIgnoreCase))
            {
                return 0m;
            }

            if (!acceptedPriorityFee)
            {
                throw new InvalidOperationException(
                    "Please accept the R100.00 High Priority service fee.");
            }

            return 100m;
        }

        private static DateTime ValidateAppointmentDateTime(
            DateTime? appointmentDateTime)
        {
            if (!appointmentDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    "Appointment date and time are required.");
            }

            var value =
                appointmentDateTime.Value;

            if (value <= DateTime.Now)
            {
                throw new InvalidOperationException(
                    "Appointment date and time must be in the future.");
            }

            var hoursRemaining =
                (value - DateTime.Now)
                .TotalHours;

            if (hoursRemaining <= 24)
            {
                throw new InvalidOperationException(
                    "Appointments must be booked more than 24 hours in advance.");
            }

            return value;
        }

        private static void EnsureRequestCanBeEdited(
            ServiceRequest request,
            bool isFuneral)
        {
            var status =
                Normalize(request.Status);

            var locked =
                status is
                    "completed" or
                    "rejected" or
                    "cancelled" or
                    "canceled" or
                    "noshow";

            if (!locked)
            {
                return;
            }

            throw new InvalidOperationException(
                isFuneral
                    ? "This funeral request cannot be changed because its status does not allow editing."
                    : "This appointment cannot be changed because its status does not allow editing.");
        }

        private static void EnsureMoreThanTwentyFourHoursRemain(
            DateTime existingDateTime,
            bool isFuneral)
        {
            var hoursRemaining =
                (existingDateTime - DateTime.Now)
                .TotalHours;

            if (hoursRemaining > 24)
            {
                return;
            }

            throw new InvalidOperationException(
                isFuneral
                    ? "This funeral request cannot be changed because 24 hours or less remain before the funeral."
                    : "This appointment cannot be changed because 24 hours or less remain before the appointment.");
        }

        private static string GetInitialStatus(
            string requestType)
        {
            return requestType switch
            {
                "Appointment" =>
                    AppointmentStatus.Requested.ToString(),

                "Quote" =>
                    QuoteRequestStatus.Requested.ToString(),

                "PolicyEnquiry" =>
                    PolicyEnquiryStatus.Submitted.ToString(),

                "PaymentEnquiry" =>
                    PaymentEnquiryStatus.Submitted.ToString(),

                "DocumentRequest" =>
                    DocumentRequestStatus.Submitted.ToString(),

                "GeneralSupport" =>
                    GeneralSupportStatus.Submitted.ToString(),

                _ => throw new InvalidOperationException(
                    $"Unsupported service request type '{requestType}'.")
            };
        }

        private static string NormalizeStatusForType(
            string requestType,
            string status)
        {
            return requestType switch
            {
                "Quote" =>
                    ParseEnumStatus<QuoteRequestStatus>(
                        status),

                "PolicyEnquiry" =>
                    ParseEnumStatus<PolicyEnquiryStatus>(
                        status),

                "PaymentEnquiry" =>
                    ParseEnumStatus<PaymentEnquiryStatus>(
                        status),

                "DocumentRequest" =>
                    ParseEnumStatus<DocumentRequestStatus>(
                        status),

                "GeneralSupport" =>
                    ParseEnumStatus<GeneralSupportStatus>(
                        status),

                _ => throw new InvalidOperationException(
                    "This request type cannot be reviewed through the shared service workflow.")
            };
        }

        private static string ParseEnumStatus<TEnum>(
            string status)
            where TEnum : struct, Enum
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                throw new InvalidOperationException(
                    "Status is required.");
            }

            var normalizedStatus =
                Normalize(status);

            foreach (var name in Enum.GetNames<TEnum>())
            {
                if (Normalize(name) == normalizedStatus)
                {
                    return name;
                }
            }

            var validStatuses =
                string.Join(
                    ", ",
                    Enum.GetNames<TEnum>());

            throw new InvalidOperationException(
                $"Invalid status. Valid statuses are: {validStatuses}.");
        }

        private static void ValidateStatusTransition(
            string requestType,
            string currentStatus,
            string newStatus)
        {
            var current =
                Normalize(currentStatus);

            var next =
                Normalize(newStatus);

            if (current == next)
            {
                return;
            }

            var allowed =
                requestType switch
                {
                    "Quote" =>
                        IsAllowedQuoteTransition(
                            current,
                            next),

                    "PolicyEnquiry" =>
                        IsAllowedPolicyTransition(
                            current,
                            next),

                    "PaymentEnquiry" =>
                        IsAllowedPaymentTransition(
                            current,
                            next),

                    "DocumentRequest" =>
                        IsAllowedDocumentTransition(
                            current,
                            next),

                    "GeneralSupport" =>
                        IsAllowedSupportTransition(
                            current,
                            next),

                    _ => false
                };

            if (!allowed)
            {
                throw new InvalidOperationException(
                    $"Status cannot change from '{currentStatus}' to '{newStatus}' for {requestType}.");
            }
        }

        private static bool IsAllowedQuoteTransition(
            string current,
            string next)
        {
            return current switch
            {
                "requested" =>
                    next is
                        "inreview" or
                        "rejected" or
                        "cancelled",

                "inreview" =>
                    next is
                        "quoted" or
                        "rejected" or
                        "cancelled",

                "quoted" =>
                    next is
                        "completed" or
                        "cancelled",

                _ => false
            };
        }

        private static bool IsAllowedPolicyTransition(
            string current,
            string next)
        {
            return current switch
            {
                "submitted" =>
                    next == "inreview",

                "inreview" =>
                    next == "responded",

                "responded" =>
                    next == "resolved",

                "resolved" =>
                    next == "closed",

                _ => false
            };
        }

        private static bool IsAllowedPaymentTransition(
            string current,
            string next)
        {
            return current switch
            {
                "submitted" =>
                    next == "inreview",

                "inreview" =>
                    next is
                        "awaitingclient" or
                        "resolved",

                "awaitingclient" =>
                    next is
                        "inreview" or
                        "resolved",

                "resolved" =>
                    next == "closed",

                _ => false
            };
        }

        private static bool IsAllowedDocumentTransition(
            string current,
            string next)
        {
            return current switch
            {
                "submitted" =>
                    next is
                        "processing" or
                        "rejected" or
                        "cancelled",

                "processing" =>
                    next is
                        "ready" or
                        "rejected" or
                        "cancelled",

                "ready" =>
                    next is
                        "delivered" or
                        "cancelled",

                _ => false
            };
        }

        private static bool IsAllowedSupportTransition(
            string current,
            string next)
        {
            return current switch
            {
                "submitted" =>
                    next == "inprogress",

                "inprogress" =>
                    next is
                        "awaitingclient" or
                        "resolved",

                "awaitingclient" =>
                    next is
                        "inprogress" or
                        "resolved",

                "resolved" =>
                    next == "closed",

                _ => false
            };
        }

        private static bool CanClientDelete(
            ServiceRequest request)
        {
            var requestType =
                ResolveExistingRequestType(
                    request.RequestType);

            var status =
                Normalize(
                    request.Status);

            return requestType switch
            {
                "Appointment" =>
                    status == "requested",

                "Quote" =>
                    status == "requested",

                "PolicyEnquiry" =>
                    status == "submitted",

                "PaymentEnquiry" =>
                    status == "submitted",

                "DocumentRequest" =>
                    status == "submitted",

                "GeneralSupport" =>
                    status == "submitted",

                _ => false
            };
        }

        private static string Normalize(
            string? value)
        {
            return (value ?? string.Empty)
                .Trim()
                .Replace(" ", "")
                .Replace("_", "")
                .Replace("-", "")
                .ToLowerInvariant();
        }
    }
}