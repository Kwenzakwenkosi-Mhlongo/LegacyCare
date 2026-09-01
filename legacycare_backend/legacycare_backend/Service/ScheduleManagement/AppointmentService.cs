// File: Service/ScheduleManagement/AppointmentService.cs

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.ScheduleManagement
{
    public class AppointmentService : IAppointmentService
    {
        private const decimal HighPriorityFee = 100m;

        private static readonly HashSet<string> AllowedAppointmentTypes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "Policy Consultation",
                "Funeral Planning",
                "General Enquiry"
            };

        private readonly AppDbContext _context;

        public AppointmentService(
            AppDbContext context)
        {
            _context = context;
        }

        public Appointment Create(
            string clientId,
            CreateAppointmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new UnauthorizedAccessException(
                    "Client identity could not be determined.");
            }

            ArgumentNullException.ThrowIfNull(request);

            var appointmentType =
                NormalizeAppointmentType(
                    request.AppointmentType);

            var branchId =
                ValidateBranch(
                    request.BranchId);

            var preferredDateTime =
                NormalizeToUtc(
                    request.PreferredDateTime);

            ValidatePreferredDateTime(
                preferredDateTime);

            var priority =
                NormalizePriority(
                    request.Priority);

            var additionalFee =
                CalculatePriorityFee(
                    priority,
                    request.AcceptPriorityFee);

            var clientExists =
                _context.Client
                    .AsNoTracking()
                    .Any(x =>
                        x.ClientId == clientId);

            if (!clientExists)
            {
                throw new KeyNotFoundException(
                    "Client record could not be found.");
            }

            Appointment? createdAppointment = null;

            var strategy =
                _context.Database
                    .CreateExecutionStrategy();

            strategy.Execute(() =>
            {
                using var transaction =
                    _context.Database
                        .BeginTransaction();

                try
                {
                    var now =
                        DateTime.UtcNow;

                    var serviceRequest =
                        new ServiceRequest
                        {
                            ClientId =
                                clientId,

                            RequestType =
                                "Appointment",

                            Status =
                                AppointmentStatus.Requested,

                            Priority =
                                priority,

                            Description =
                                NormalizeOptionalText(
                                    request.ClientNotes),

                            BranchId =
                                branchId,

                            AppointmentDateTime =
                                preferredDateTime,

                            DueDate =
                                preferredDateTime,

                            AdditionalFee =
                                additionalFee,

                            CreatedDate =
                                now,

                            UpdatedDate =
                                null
                        };

                    _context.ServiceRequests.Add(
                        serviceRequest);

                    _context.SaveChanges();

                    createdAppointment =
                        new Appointment
                        {
                            ServiceRequestId =
                                serviceRequest.ServiceRequestId,

                            ClientId =
                                clientId,

                            BranchId =
                                branchId,

                            AppointmentType =
                                appointmentType,

                            PreferredDateTime =
                                preferredDateTime,

                            ConfirmedDateTime =
                                null,

                            Status =
                                AppointmentStatus.Requested,

                            Priority =
                                priority,

                            ClientNotes =
                                NormalizeOptionalText(
                                    request.ClientNotes),

                            ClerkNotes =
                                null,

                            AssignedStaffId =
                                null,

                            RescheduleReason =
                                null,

                            CancellationReason =
                                null,

                            CreatedDate =
                                now,

                            UpdatedDate =
                                now,

                            ConfirmedDate =
                                null,

                            CompletedDate =
                                null,

                            CancelledDate =
                                null
                        };

                    _context.Appointments.Add(
                        createdAppointment);

                    _context.SaveChanges();

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            });

            if (createdAppointment == null)
            {
                throw new InvalidOperationException(
                    "Appointment could not be created.");
            }

            return GetById(
                createdAppointment.AppointmentId)
                ?? throw new InvalidOperationException(
                    "Appointment was created but could not be reloaded.");
        }

        public IEnumerable<Appointment> GetByClient(
            string clientId)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                return Enumerable.Empty<Appointment>();
            }

            return BaseQuery()
                .Where(x =>
                    x.ClientId == clientId)
                .OrderByDescending(x =>
                    x.CreatedDate)
                .ToList();
        }

        public Appointment? GetById(
            int appointmentId)
        {
            return BaseQuery()
                .FirstOrDefault(x =>
                    x.AppointmentId == appointmentId);
        }

        public Appointment UpdateForClient(
            int appointmentId,
            string clientId,
            UpdateAppointmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new UnauthorizedAccessException(
                    "Client identity could not be determined.");
            }

            ArgumentNullException.ThrowIfNull(request);

            var appointmentType =
                NormalizeAppointmentType(
                    request.AppointmentType);

            var branchId =
                ValidateBranch(
                    request.BranchId);

            var preferredDateTime =
                NormalizeToUtc(
                    request.PreferredDateTime);

            ValidatePreferredDateTime(
                preferredDateTime);

            var priority =
                NormalizePriority(
                    request.Priority);

            var additionalFee =
                CalculatePriorityFee(
                    priority,
                    request.AcceptPriorityFee);

            var strategy =
                _context.Database
                    .CreateExecutionStrategy();

            strategy.Execute(() =>
            {
                using var transaction =
                    _context.Database
                        .BeginTransaction();

                try
                {
                    var appointment =
                        _context.Appointments
                            .Include(x =>
                                x.ServiceRequest)
                            .FirstOrDefault(x =>
                                x.AppointmentId ==
                                appointmentId);

                    if (appointment == null)
                    {
                        throw new KeyNotFoundException(
                            "Appointment was not found.");
                    }

                    if (!string.Equals(
                            appointment.ClientId,
                            clientId,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        throw new UnauthorizedAccessException(
                            "You are not allowed to update this appointment.");
                    }

                    if (AppointmentStatus.IsClosed(
                            appointment.Status))
                    {
                        throw new InvalidOperationException(
                            "This appointment can no longer be edited.");
                    }

                    var currentScheduledDateTime =
                        appointment.ConfirmedDateTime
                        ?? appointment.PreferredDateTime;

                    var hoursRemaining =
                        (NormalizeToUtc(
                                currentScheduledDateTime) -
                            DateTime.UtcNow)
                        .TotalHours;

                    if (hoursRemaining <= 24)
                    {
                        throw new InvalidOperationException(
                            "This appointment cannot be edited because 24 hours or less remain.");
                    }

                    var dateChanged =
                        NormalizeToUtc(
                            appointment.PreferredDateTime) !=
                        preferredDateTime;

                    var branchChanged =
                        !string.Equals(
                            appointment.BranchId,
                            branchId,
                            StringComparison.OrdinalIgnoreCase);

                    var requiresNewConfirmation =
                        dateChanged ||
                        branchChanged;

                    appointment.AppointmentType =
                        appointmentType;

                    appointment.BranchId =
                        branchId;

                    appointment.PreferredDateTime =
                        preferredDateTime;

                    appointment.Priority =
                        priority;

                    appointment.ClientNotes =
                        NormalizeOptionalText(
                            request.ClientNotes);

                    appointment.UpdatedDate =
                        DateTime.UtcNow;

                    if (requiresNewConfirmation)
                    {
                        appointment.Status =
                            AppointmentStatus.Requested;

                        appointment.ConfirmedDateTime =
                            null;

                        appointment.AssignedStaffId =
                            null;

                        appointment.ConfirmedDate =
                            null;

                        appointment.RescheduleReason =
                            null;

                        appointment.CancellationReason =
                            null;

                        appointment.ClerkNotes =
                            null;
                    }

                    var serviceRequest =
                        appointment.ServiceRequest;

                    if (serviceRequest == null)
                    {
                        throw new InvalidOperationException(
                            "The linked service request could not be found.");
                    }

                    serviceRequest.RequestType =
                        "Appointment";

                    serviceRequest.Status =
                        appointment.Status;

                    serviceRequest.Priority =
                        priority;

                    serviceRequest.Description =
                        appointment.ClientNotes;

                    serviceRequest.BranchId =
                        branchId;

                    serviceRequest.AppointmentDateTime =
                        requiresNewConfirmation
                            ? preferredDateTime
                            : appointment.ConfirmedDateTime
                                ?? preferredDateTime;

                    serviceRequest.DueDate =
                        serviceRequest.AppointmentDateTime;

                    serviceRequest.AdditionalFee =
                        additionalFee;

                    serviceRequest.UpdatedDate =
                        DateTime.UtcNow;

                    _context.SaveChanges();

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            });

            return GetById(
                appointmentId)
                ?? throw new InvalidOperationException(
                    "Appointment was updated but could not be reloaded.");
        }

        public IEnumerable<Appointment> GetForClerk(
            string? branchId = null,
            string? status = null)
        {
            var query =
                BaseQuery()
                    .AsQueryable();

            if (!string.IsNullOrWhiteSpace(
                    branchId))
            {
                var normalizedBranchId =
                    branchId.Trim();

                query =
                    query.Where(x =>
                        x.BranchId ==
                        normalizedBranchId);
            }

            if (!string.IsNullOrWhiteSpace(
                    status))
            {
                var normalizedStatus =
                    status.Trim();

                if (!AppointmentStatus.IsValid(
                        normalizedStatus))
                {
                    throw new InvalidOperationException(
                        "Invalid appointment status.");
                }

                query =
                    query.Where(x =>
                        x.Status ==
                        normalizedStatus);
            }

            return query
                .OrderBy(x =>
                    x.Status ==
                    AppointmentStatus.Requested
                        ? 0
                        : 1)
                .ThenByDescending(x =>
                    x.Priority == "High")
                .ThenBy(x =>
                    x.PreferredDateTime)
                .ToList();
        }

        public IEnumerable<Staff> GetAvailableStaff(
            int appointmentId,
            DateTime? appointmentDateTime = null)
        {
            var appointment =
                _context.Appointments
                    .AsNoTracking()
                    .FirstOrDefault(x =>
                        x.AppointmentId ==
                        appointmentId);

            if (appointment == null)
            {
                throw new KeyNotFoundException(
                    "Appointment was not found.");
            }

            if (AppointmentStatus.IsClosed(
                    appointment.Status))
            {
                throw new InvalidOperationException(
                    "Staff cannot be assigned to a closed appointment.");
            }

            var targetDateTime =
                NormalizeToUtc(
                    appointmentDateTime
                    ?? appointment.ConfirmedDateTime
                    ?? appointment.PreferredDateTime);

            if (targetDateTime <=
                DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "The appointment date and time must be in the future.");
            }

            var busyAppointmentStaffIds =
                _context.Appointments
                    .AsNoTracking()
                    .Where(x =>
                        x.AppointmentId !=
                        appointmentId &&
                        x.AssignedStaffId != null &&
                        x.Status !=
                        AppointmentStatus.Cancelled &&
                        x.Status !=
                        AppointmentStatus.Completed &&
                        x.Status !=
                        AppointmentStatus.NoShow &&
                        (
                            x.ConfirmedDateTime ??
                            x.PreferredDateTime
                        ) == targetDateTime)
                    .Select(x =>
                        x.AssignedStaffId!)
                    .ToHashSet();

            var busyFuneralStaffIds =
                _context.FuneralStaffDeployments
                    .AsNoTracking()
                    .Include(x =>
                        x.FuneralRequest)
                    .Where(x =>
                        x.FuneralRequest != null &&
                        x.FuneralRequest.FuneralDate.Date ==
                        targetDateTime.Date &&
                        x.FuneralRequest.FuneralTime ==
                        targetDateTime.TimeOfDay)
                    .Select(x =>
                        x.StaffId)
                    .ToHashSet();

            return _context.Staff
                .AsNoTracking()
                .Include(x =>
                    x.User)
                .Include(x =>
                    x.Branch)
                .Where(x =>
                    x.BranchId ==
                    appointment.BranchId &&
                    x.User != null &&
                    x.User.IsActive)
                .ToList()
                .Where(x =>
                    !busyAppointmentStaffIds.Contains(
                        x.StaffId) &&
                    !busyFuneralStaffIds.Contains(
                        x.StaffId))
                .OrderBy(x =>
                    x.User!.FullName)
                .ToList();
        }

        public Appointment Review(
            int appointmentId,
            ReviewAppointmentRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            var appointment =
                _context.Appointments
                    .Include(x =>
                        x.ServiceRequest)
                    .Include(x =>
                        x.Branch)
                    .Include(x =>
                        x.AssignedStaff)
                    .ThenInclude(x =>
                        x!.User)
                    .FirstOrDefault(x =>
                        x.AppointmentId ==
                        appointmentId);

            if (appointment == null)
            {
                throw new KeyNotFoundException(
                    "Appointment was not found.");
            }

            if (AppointmentStatus.IsClosed(
                    appointment.Status))
            {
                throw new InvalidOperationException(
                    $"This appointment is already {appointment.Status} and cannot be changed.");
            }

            var action =
                NormalizeAction(
                    request.Action);

            var strategy =
                _context.Database
                    .CreateExecutionStrategy();

            strategy.Execute(() =>
            {
                using var transaction =
                    _context.Database
                        .BeginTransaction();

                try
                {
                    switch (action)
                    {
                        case "confirm":
                            ConfirmAppointment(
                                appointment,
                                request);
                            break;

                        case "reschedule":
                            RescheduleAppointment(
                                appointment,
                                request);
                            break;

                        case "complete":
                            CompleteAppointment(
                                appointment,
                                request);
                            break;

                        case "cancel":
                            CancelAppointment(
                                appointment,
                                request);
                            break;

                        case "noshow":
                            MarkNoShow(
                                appointment,
                                request);
                            break;

                        default:
                            throw new InvalidOperationException(
                                "Invalid appointment action.");
                    }

                    appointment.UpdatedDate =
                        DateTime.UtcNow;

                    SynchronizeServiceRequest(
                        appointment);

                    _context.SaveChanges();

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            });

            return GetById(
                appointmentId)
                ?? throw new InvalidOperationException(
                    "Appointment was updated but could not be reloaded.");
        }

        private IQueryable<Appointment> BaseQuery()
        {
            return _context.Appointments
                .AsNoTracking()
                .Include(x =>
                    x.ServiceRequest)
                .Include(x =>
                    x.Client)
                .Include(x =>
                    x.Branch)
                .Include(x =>
                    x.AssignedStaff)
                .ThenInclude(x =>
                    x!.User);
        }

        private void ConfirmAppointment(
            Appointment appointment,
            ReviewAppointmentRequest request)
        {
            var confirmedDateTime =
                NormalizeToUtc(
                    request.ConfirmedDateTime
                    ?? appointment.PreferredDateTime);

            ValidateClerkDateTime(
                confirmedDateTime);

            ValidateAndAssignStaff(
                appointment,
                request.AssignedStaffId,
                confirmedDateTime);

            appointment.ConfirmedDateTime =
                confirmedDateTime;

            appointment.Status =
                AppointmentStatus.Confirmed;

            appointment.ClerkNotes =
                NormalizeOptionalText(
                    request.ClerkNotes);

            appointment.RescheduleReason =
                null;

            appointment.CancellationReason =
                null;

            appointment.ConfirmedDate =
                DateTime.UtcNow;
        }

        private void RescheduleAppointment(
            Appointment appointment,
            ReviewAppointmentRequest request)
        {
            if (!request.ConfirmedDateTime.HasValue)
            {
                throw new InvalidOperationException(
                    "A new appointment date and time are required when rescheduling.");
            }

            var confirmedDateTime =
                NormalizeToUtc(
                    request.ConfirmedDateTime.Value);

            ValidateClerkDateTime(
                confirmedDateTime);

            var reason =
                NormalizeOptionalText(
                    request.Reason);

            if (string.IsNullOrWhiteSpace(
                    reason))
            {
                throw new InvalidOperationException(
                    "A reschedule reason is required.");
            }

            ValidateAndAssignStaff(
                appointment,
                request.AssignedStaffId,
                confirmedDateTime);

            appointment.ConfirmedDateTime =
                confirmedDateTime;

            appointment.Status =
                AppointmentStatus.Rescheduled;

            appointment.RescheduleReason =
                reason;

            appointment.ClerkNotes =
                NormalizeOptionalText(
                    request.ClerkNotes);

            appointment.CancellationReason =
                null;

            appointment.ConfirmedDate =
                DateTime.UtcNow;
        }

        private static void CompleteAppointment(
            Appointment appointment,
            ReviewAppointmentRequest request)
        {
            if (!string.Equals(
                    appointment.Status,
                    AppointmentStatus.Confirmed,
                    StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(
                    appointment.Status,
                    AppointmentStatus.Rescheduled,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Only confirmed or rescheduled appointments can be completed.");
            }

            var scheduledDateTime =
                NormalizeToUtc(
                    appointment.ConfirmedDateTime
                    ?? appointment.PreferredDateTime);

            if (scheduledDateTime >
                DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "An appointment cannot be completed before its scheduled time.");
            }

            appointment.Status =
                AppointmentStatus.Completed;

            appointment.CompletedDate =
                DateTime.UtcNow;

            appointment.ClerkNotes =
                NormalizeOptionalText(
                    request.ClerkNotes);
        }

        private static void CancelAppointment(
            Appointment appointment,
            ReviewAppointmentRequest request)
        {
            var reason =
                NormalizeOptionalText(
                    request.Reason);

            if (string.IsNullOrWhiteSpace(
                    reason))
            {
                throw new InvalidOperationException(
                    "A cancellation reason is required.");
            }

            appointment.Status =
                AppointmentStatus.Cancelled;

            appointment.CancellationReason =
                reason;

            appointment.ClerkNotes =
                NormalizeOptionalText(
                    request.ClerkNotes);

            appointment.CancelledDate =
                DateTime.UtcNow;
        }

        private static void MarkNoShow(
            Appointment appointment,
            ReviewAppointmentRequest request)
        {
            if (!string.Equals(
                    appointment.Status,
                    AppointmentStatus.Confirmed,
                    StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(
                    appointment.Status,
                    AppointmentStatus.Rescheduled,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Only confirmed or rescheduled appointments can be marked as no-show.");
            }

            var scheduledDateTime =
                NormalizeToUtc(
                    appointment.ConfirmedDateTime
                    ?? appointment.PreferredDateTime);

            if (scheduledDateTime >
                DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "An appointment cannot be marked as no-show before its scheduled time.");
            }

            appointment.Status =
                AppointmentStatus.NoShow;

            appointment.ClerkNotes =
                NormalizeOptionalText(
                    request.ClerkNotes);
        }

        private void ValidateAndAssignStaff(
            Appointment appointment,
            string? staffId,
            DateTime targetDateTime)
        {
            if (string.IsNullOrWhiteSpace(
                    staffId))
            {
                appointment.AssignedStaffId =
                    null;

                return;
            }

            var normalizedStaffId =
                staffId.Trim();

            var staff =
                _context.Staff
                    .Include(x =>
                        x.User)
                    .FirstOrDefault(x =>
                        x.StaffId ==
                        normalizedStaffId);

            if (staff == null)
            {
                throw new KeyNotFoundException(
                    "The selected staff member could not be found.");
            }

            if (staff.User == null ||
                !staff.User.IsActive)
            {
                throw new InvalidOperationException(
                    "The selected staff member is inactive.");
            }

            if (!string.Equals(
                    staff.BranchId,
                    appointment.BranchId,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "The selected staff member must belong to the appointment branch.");
            }

            var appointmentConflict =
                _context.Appointments
                    .AsNoTracking()
                    .Any(x =>
                        x.AppointmentId !=
                        appointment.AppointmentId &&
                        x.AssignedStaffId ==
                        normalizedStaffId &&
                        x.Status !=
                        AppointmentStatus.Cancelled &&
                        x.Status !=
                        AppointmentStatus.Completed &&
                        x.Status !=
                        AppointmentStatus.NoShow &&
                        (
                            x.ConfirmedDateTime ??
                            x.PreferredDateTime
                        ) == targetDateTime);

            if (appointmentConflict)
            {
                throw new InvalidOperationException(
                    "The selected staff member already has another appointment at this date and time.");
            }

            var funeralConflict =
                _context.FuneralStaffDeployments
                    .AsNoTracking()
                    .Include(x =>
                        x.FuneralRequest)
                    .Any(x =>
                        x.StaffId ==
                        normalizedStaffId &&
                        x.FuneralRequest != null &&
                        x.FuneralRequest.FuneralDate.Date ==
                        targetDateTime.Date &&
                        x.FuneralRequest.FuneralTime ==
                        targetDateTime.TimeOfDay);

            if (funeralConflict)
            {
                throw new InvalidOperationException(
                    "The selected staff member is assigned to a funeral at this date and time.");
            }

            appointment.AssignedStaffId =
                normalizedStaffId;
        }

        private void SynchronizeServiceRequest(
            Appointment appointment)
        {
            var serviceRequest =
                appointment.ServiceRequest
                ?? _context.ServiceRequests
                    .FirstOrDefault(x =>
                        x.ServiceRequestId ==
                        appointment.ServiceRequestId);

            if (serviceRequest == null)
            {
                throw new InvalidOperationException(
                    "The linked service request could not be found.");
            }

            var scheduledDateTime =
                appointment.ConfirmedDateTime
                ?? appointment.PreferredDateTime;

            serviceRequest.Status =
                appointment.Status;

            serviceRequest.Priority =
                appointment.Priority;

            serviceRequest.BranchId =
                appointment.BranchId;

            serviceRequest.AppointmentDateTime =
                scheduledDateTime;

            serviceRequest.DueDate =
                scheduledDateTime;

            serviceRequest.Description =
                appointment.ClientNotes;

            serviceRequest.UpdatedDate =
                DateTime.UtcNow;
        }

        private string ValidateBranch(
            string? branchId)
        {
            if (string.IsNullOrWhiteSpace(
                    branchId))
            {
                throw new InvalidOperationException(
                    "A preferred branch is required.");
            }

            var normalizedBranchId =
                branchId.Trim();

            var branchExists =
                _context.Branch
                    .AsNoTracking()
                    .Any(x =>
                        x.BranchId ==
                        normalizedBranchId &&
                        x.IsActive);

            if (!branchExists)
            {
                throw new InvalidOperationException(
                    "The selected branch does not exist or is inactive.");
            }

            return normalizedBranchId;
        }

        private static string NormalizeAppointmentType(
            string? appointmentType)
        {
            if (string.IsNullOrWhiteSpace(
                    appointmentType))
            {
                throw new InvalidOperationException(
                    "Appointment type is required.");
            }

            var normalized =
                appointmentType.Trim();

            if (!AllowedAppointmentTypes.Contains(
                    normalized))
            {
                throw new InvalidOperationException(
                    "Invalid appointment type.");
            }

            return AllowedAppointmentTypes
                .First(x =>
                    x.Equals(
                        normalized,
                        StringComparison.OrdinalIgnoreCase));
        }

        private static void ValidatePreferredDateTime(
            DateTime preferredDateTime)
        {
            var utcDateTime =
                NormalizeToUtc(
                    preferredDateTime);

            if (utcDateTime <=
                DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "Appointment date and time must be in the future.");
            }

            if ((utcDateTime -
                    DateTime.UtcNow)
                .TotalHours <= 24)
            {
                throw new InvalidOperationException(
                    "Appointments must be booked more than 24 hours in advance.");
            }
        }

        private static void ValidateClerkDateTime(
            DateTime dateTime)
        {
            if (NormalizeToUtc(
                    dateTime) <=
                DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "Confirmed appointment date and time must be in the future.");
            }
        }

        private static string NormalizePriority(
            string? priority)
        {
            if (string.IsNullOrWhiteSpace(
                    priority))
            {
                return "Normal";
            }

            if (priority.Equals(
                    "Normal",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "Normal";
            }

            if (priority.Equals(
                    "High",
                    StringComparison.OrdinalIgnoreCase))
            {
                return "High";
            }

            throw new InvalidOperationException(
                "Invalid appointment priority.");
        }

        private static decimal CalculatePriorityFee(
            string priority,
            bool acceptPriorityFee)
        {
            if (!string.Equals(
                    priority,
                    "High",
                    StringComparison.OrdinalIgnoreCase))
            {
                return 0m;
            }

            if (!acceptPriorityFee)
            {
                throw new InvalidOperationException(
                    "Please accept the R100.00 High Priority service fee.");
            }

            return HighPriorityFee;
        }

        private static string NormalizeAction(
            string? action)
        {
            if (string.IsNullOrWhiteSpace(
                    action))
            {
                throw new InvalidOperationException(
                    "Appointment action is required.");
            }

            var normalized =
                action
                    .Trim()
                    .Replace(" ", string.Empty)
                    .ToLowerInvariant();

            return normalized switch
            {
                "confirm" => "confirm",
                "reschedule" => "reschedule",
                "complete" => "complete",
                "cancel" => "cancel",
                "noshow" => "noshow",

                _ => throw new InvalidOperationException(
                    "Action must be Confirm, Reschedule, Complete, Cancel, or NoShow.")
            };
        }

        private static string? NormalizeOptionalText(
            string? value)
        {
            return string.IsNullOrWhiteSpace(
                    value)
                ? null
                : value.Trim();
        }

        private static DateTime NormalizeToUtc(
            DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc =>
                    value,

                DateTimeKind.Local =>
                    value.ToUniversalTime(),

                _ =>
                    DateTime.SpecifyKind(
                        value,
                        DateTimeKind.Utc)
            };
        }
    }
}