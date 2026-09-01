// ============================================================
// FILE:
// Service/MortuaryManagement/FuneralRequestService.cs
// ============================================================

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class FuneralRequestService
        : IFuneralRequestService
    {
        private readonly AppDbContext _context;

        private const int MaxFuneralsPerDay = 6;

        private const int StaffPerFuneral = 4;

        public FuneralRequestService(
            AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // CREATE FUNERAL REQUEST
        // ============================================================

        public FuneralRequest Create(
            string userId,
            CreateFuneralRequestRequest request)
        {
            if (string.IsNullOrWhiteSpace(
                userId))
            {
                throw new InvalidOperationException(
                    "A logged-in user is required.");
            }

            if (request == null)
            {
                throw new InvalidOperationException(
                    "Funeral request information is required.");
            }

            if (string.IsNullOrWhiteSpace(
                request.DeathNotificationId))
            {
                throw new InvalidOperationException(
                    "A death notification is required.");
            }

            // --------------------------------------------------------
            // DEATH NOTIFICATION
            // --------------------------------------------------------

            var notification =
                _context.DeathNotifications
                    .Include(x => x.Branch)
                    .FirstOrDefault(x =>
                        x.DeathNotificationId ==
                        request.DeathNotificationId);

            if (notification == null)
            {
                throw new KeyNotFoundException(
                    "Death notification not found.");
            }

            // --------------------------------------------------------
            // OWNERSHIP
            // --------------------------------------------------------

            if (!string.Equals(
                    notification.ReportedByUserId,
                    userId,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "This death notification does not belong to your account.");
            }

            // --------------------------------------------------------
            // DEATH MUST BE APPROVED
            // --------------------------------------------------------

            if (notification.Status !=
                DeathNotificationStatus.Approved)
            {
                throw new InvalidOperationException(
                    "A funeral can only be requested after the death notification has been approved.");
            }

            // --------------------------------------------------------
            // DUPLICATE FUNERAL
            // --------------------------------------------------------

            var alreadyExists =
                _context.FuneralRequests
                    .Any(x =>
                        x.DeathNotificationId ==
                        notification.DeathNotificationId);

            if (alreadyExists)
            {
                throw new InvalidOperationException(
                    "A funeral request has already been created for this death notification.");
            }

            // --------------------------------------------------------
            // CLIENT
            // --------------------------------------------------------

            var client =
                _context.Client
                    .FirstOrDefault(x =>
                        x.UserId ==
                        userId);

            if (client == null)
            {
                throw new InvalidOperationException(
                    "Client account was not found.");
            }

            // --------------------------------------------------------
            // DATE / TIME
            // --------------------------------------------------------

            var funeralDate =
                request.FuneralDate.Date;

            var funeralDateTime =
                funeralDate.Add(
                    request.FuneralTime);

            if (funeralDateTime <=
                DateTime.Now)
            {
                throw new InvalidOperationException(
                    "The funeral date and time must be in the future.");
            }

            // --------------------------------------------------------
            // VENUE
            // --------------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                request.Venue))
            {
                throw new InvalidOperationException(
                    "A venue is required.");
            }

            // --------------------------------------------------------
            // BRANCH
            //
            // The death notification branch should drive the funeral
            // staffing branch.
            // --------------------------------------------------------

            var branchId =
                !string.IsNullOrWhiteSpace(
                    notification.BranchId)
                    ? notification.BranchId
                    : client.BranchId;

            if (string.IsNullOrWhiteSpace(
                branchId))
            {
                throw new InvalidOperationException(
                    "A LegacyCare branch could not be determined for this funeral.");
            }

            // --------------------------------------------------------
            // DAILY CAPACITY
            // --------------------------------------------------------

            var funeralCount =
                _context.FuneralRequests
                    .Count(x =>
                        x.FuneralDate ==
                            funeralDate &&
                        x.Status !=
                            "Rejected" &&
                        x.Status !=
                            "Cancelled");

            if (funeralCount >=
                MaxFuneralsPerDay)
            {
                throw new InvalidOperationException(
                    "This funeral date is fully booked. LegacyCare can accommodate a maximum of 6 funerals per day.");
            }

            // --------------------------------------------------------
            // BRANCH OPERATIONAL STAFF
            // --------------------------------------------------------

            var branchOperationalStaffCount =
                _context.Staff
                    .Include(x =>
                        x.User)
                    .Count(x =>
                        x.BranchId ==
                            branchId &&
                        x.User.IsActive &&
                        IsOperationalRole(
                            x.StaffRole));

            if (branchOperationalStaffCount <
                StaffPerFuneral)
            {
                throw new InvalidOperationException(
                    $"Branch {branchId} does not have at least {StaffPerFuneral} active operational staff members.");
            }

            using var transaction =
                _context.Database.BeginTransaction();

            try
            {
                var now =
                    DateTime.UtcNow;

                var funeralRequest =
                    new FuneralRequest
                    {
                        DeathNotificationId =
                            notification.DeathNotificationId,

                        ClientId =
                            client.ClientId!,

                        BranchId =
                            branchId,

                        FuneralDate =
                            funeralDate,

                        FuneralTime =
                            request.FuneralTime,

                        Venue =
                            request.Venue.Trim(),

                        FuneralType =
                            string.IsNullOrWhiteSpace(
                                request.FuneralType)
                                ? "Standard"
                                : request.FuneralType.Trim(),

                        Notes =
                            string.IsNullOrWhiteSpace(
                                request.Notes)
                                ? null
                                : request.Notes.Trim(),

                        Status =
                            "Pending",

                        StaffRequired =
                            StaffPerFuneral,

                        CreatedDate =
                            now,

                        UpdatedDate =
                            now
                    };

                _context.FuneralRequests
                    .Add(
                        funeralRequest);

                _context.SaveChanges();

                // ----------------------------------------------------
                // GENERIC SERVICE REQUEST
                // ----------------------------------------------------

                var serviceRequest =
                    new ServiceRequest
                    {
                        ClientId =
                            client.ClientId!,

                        BranchId =
                            branchId,

                        RequestType =
                            "Funeral",

                        Status =
                            "Pending",

                        Priority =
                            "Normal",

                        Description =
                            BuildDescription(
                                funeralRequest),

                        FuneralRequestId =
                            funeralRequest.FuneralRequestId,

                        DeathNotificationId =
                            notification.DeathNotificationId,

                        AppointmentDateTime =
                            funeralDateTime,

                        DueDate =
                            funeralDateTime,

                        CreatedDate =
                            now,

                        UpdatedDate =
                            now,

                        AssignedStaffId =
                            null,

                        AdditionalFee =
                            0
                    };

                _context.ServiceRequests
                    .Add(
                        serviceRequest);

                _context.SaveChanges();

                transaction.Commit();

                return funeralRequest;
            }
            catch
            {
                transaction.Rollback();

                throw;
            }
        }

        // ============================================================
        // CLIENT REQUESTS
        // ============================================================

        public IEnumerable<FuneralRequest>
            GetByClientUserId(
                string userId)
        {
            var client =
                _context.Client
                    .FirstOrDefault(x =>
                        x.UserId ==
                        userId);

            if (client == null)
            {
                return Enumerable
                    .Empty<FuneralRequest>();
            }

            return _context.FuneralRequests
                .Include(x =>
                    x.DeathNotification)
                .Include(x =>
                    x.Branch)
                .Include(x =>
                    x.StaffDeployments)
                    .ThenInclude(x =>
                        x.Staff)
                        .ThenInclude(x =>
                            x!.User)
                .Where(x =>
                    x.ClientId ==
                    client.ClientId)
                .OrderByDescending(x =>
                    x.CreatedDate)
                .ToList();
        }

        // ============================================================
        // GET BY ID
        // ============================================================

        public FuneralRequest? GetById(
            string funeralRequestId)
        {
            return _context.FuneralRequests
                .Include(x =>
                    x.DeathNotification)
                .Include(x =>
                    x.Client)
                .Include(x =>
                    x.Branch)
                .Include(x =>
                    x.StaffDeployments)
                    .ThenInclude(x =>
                        x.Staff)
                        .ThenInclude(x =>
                            x!.User)
                .FirstOrDefault(x =>
                    x.FuneralRequestId ==
                    funeralRequestId);
        }

        // ============================================================
        // PENDING FOR CLERK
        // ============================================================

        public IEnumerable<FuneralRequest>
            GetPendingRequests()
        {
            return _context.FuneralRequests
                .Include(x =>
                    x.Client)
                .Include(x =>
                    x.DeathNotification)
                .Include(x =>
                    x.Branch)
                .Include(x =>
                    x.StaffDeployments)
                    .ThenInclude(x =>
                        x.Staff)
                        .ThenInclude(x =>
                            x!.User)
                .Where(x =>
                    x.Status ==
                    "Pending")
                .OrderBy(x =>
                    x.FuneralDate)
                .ThenBy(x =>
                    x.FuneralTime)
                .ToList();
        }

        // ============================================================
        // AVAILABLE BRANCH STAFF
        // ============================================================

        public IEnumerable<Staff>
            GetAvailableStaff(
                string funeralRequestId)
        {
            var funeral =
                _context.FuneralRequests
                    .FirstOrDefault(x =>
                        x.FuneralRequestId ==
                        funeralRequestId);

            if (funeral == null)
            {
                throw new KeyNotFoundException(
                    "Funeral request not found.");
            }

            if (string.IsNullOrWhiteSpace(
                funeral.BranchId))
            {
                throw new InvalidOperationException(
                    "The funeral does not have a LegacyCare branch.");
            }

            var currentlyAssignedToThisFuneral =
                _context.FuneralStaffDeployments
                    .Where(x =>
                        x.FuneralRequestId ==
                        funeral.FuneralRequestId)
                    .Select(x =>
                        x.StaffId)
                    .ToList();

            var unavailableStaff =
                _context.FuneralStaffDeployments
                    .Where(x =>
                        x.FuneralRequestId !=
                            funeral.FuneralRequestId &&

                        x.FuneralRequest != null &&

                        x.FuneralRequest.FuneralDate ==
                            funeral.FuneralDate &&

                        x.FuneralRequest.FuneralTime ==
                            funeral.FuneralTime &&

                        x.FuneralRequest.Status !=
                            "Rejected" &&

                        x.FuneralRequest.Status !=
                            "Cancelled")
                    .Select(x =>
                        x.StaffId)
                    .Distinct()
                    .ToList();

            return _context.Staff
                .Include(x =>
                    x.User)
                .Include(x =>
                    x.Branch)
                .Where(x =>
                    x.BranchId ==
                        funeral.BranchId &&

                    x.User.IsActive &&

                    (
                        x.StaffRole ==
                            StaffType.Driver ||

                        x.StaffRole ==
                            StaffType.GraveDigger ||

                        x.StaffRole ==
                            StaffType.MortuaryAttendant ||

                        x.StaffRole ==
                            StaffType.OnSiteStaff
                    ) &&

                    (
                        currentlyAssignedToThisFuneral
                            .Contains(
                                x.StaffId) ||

                        !unavailableStaff
                            .Contains(
                                x.StaffId)
                    ))
                .OrderBy(x =>
                    x.User.FullName)
                .ToList();
        }

        // ============================================================
        // CLERK - ASSIGN EXACTLY FOUR STAFF
        // ============================================================

        public FuneralRequest AssignStaff(
            string clerkUserId,
            string funeralRequestId,
            DeployFuneralStaffRequest request)
        {
            if (string.IsNullOrWhiteSpace(
                clerkUserId))
            {
                throw new InvalidOperationException(
                    "The clerk user ID is required.");
            }

            if (request?.StaffIds == null)
            {
                throw new InvalidOperationException(
                    "Staff selection is required.");
            }

            var staffIds =
                request.StaffIds
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(
                            x))
                    .Select(x =>
                        x.Trim())
                    .Distinct(
                        StringComparer.OrdinalIgnoreCase)
                    .ToList();

            if (staffIds.Count !=
                StaffPerFuneral)
            {
                throw new InvalidOperationException(
                    $"Exactly {StaffPerFuneral} staff members must be selected for each funeral.");
            }

            var funeral =
                _context.FuneralRequests
                    .Include(x =>
                        x.StaffDeployments)
                    .FirstOrDefault(x =>
                        x.FuneralRequestId ==
                        funeralRequestId);

            if (funeral == null)
            {
                throw new KeyNotFoundException(
                    "Funeral request not found.");
            }

            if (!string.Equals(
                    funeral.Status,
                    "Pending",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Staff can only be assigned while the funeral request is pending.");
            }

            if (string.IsNullOrWhiteSpace(
                funeral.BranchId))
            {
                throw new InvalidOperationException(
                    "The funeral does not have a branch.");
            }

            // --------------------------------------------------------
            // LOAD SELECTED STAFF
            // --------------------------------------------------------

            var selectedStaff =
                _context.Staff
                    .Include(x =>
                        x.User)
                    .Where(x =>
                        staffIds.Contains(
                            x.StaffId))
                    .ToList();

            if (selectedStaff.Count !=
                StaffPerFuneral)
            {
                throw new InvalidOperationException(
                    "One or more selected staff members could not be found.");
            }

            // --------------------------------------------------------
            // VALIDATE SAME BRANCH + ACTIVE + OPERATIONAL
            // --------------------------------------------------------

            foreach (var staff
                     in selectedStaff)
            {
                if (!string.Equals(
                        staff.BranchId,
                        funeral.BranchId,
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        $"Staff member {staff.DisplayStaffId} does not belong to branch {funeral.BranchId}.");
                }

                if (!staff.User.IsActive)
                {
                    throw new InvalidOperationException(
                        $"Staff member {staff.DisplayStaffId} is not active.");
                }

                if (!IsOperationalRole(
                        staff.StaffRole))
                {
                    throw new InvalidOperationException(
                        $"Staff member {staff.DisplayStaffId} is not an operational funeral staff member.");
                }
            }

            // --------------------------------------------------------
            // PREVENT DOUBLE BOOKING
            // --------------------------------------------------------

            var conflictingStaffIds =
                _context.FuneralStaffDeployments
                    .Where(x =>
                        staffIds.Contains(
                            x.StaffId) &&

                        x.FuneralRequestId !=
                            funeral.FuneralRequestId &&

                        x.FuneralRequest != null &&

                        x.FuneralRequest.FuneralDate ==
                            funeral.FuneralDate &&

                        x.FuneralRequest.FuneralTime ==
                            funeral.FuneralTime &&

                        x.FuneralRequest.Status !=
                            "Rejected" &&

                        x.FuneralRequest.Status !=
                            "Cancelled")
                    .Select(x =>
                        x.StaffId)
                    .Distinct()
                    .ToList();

            if (conflictingStaffIds.Count >
                0)
            {
                throw new InvalidOperationException(
                    $"One or more selected staff members are already assigned to another funeral at {funeral.FuneralTime:hh\\:mm} on {funeral.FuneralDate:dd MMM yyyy}.");
            }

            using var transaction =
                _context.Database.BeginTransaction();

            try
            {
                // Re-selecting staff replaces the previous pending
                // assignment for this funeral.

                var existingDeployments =
                    _context
                        .FuneralStaffDeployments
                        .Where(x =>
                            x.FuneralRequestId ==
                            funeral.FuneralRequestId)
                        .ToList();

                if (existingDeployments.Count >
                    0)
                {
                    _context
                        .FuneralStaffDeployments
                        .RemoveRange(
                            existingDeployments);
                }

                foreach (var staffId
                         in staffIds)
                {
                    _context
                        .FuneralStaffDeployments
                        .Add(
                            new FuneralStaffDeployment
                            {
                                FuneralRequestId =
                                    funeral.FuneralRequestId,

                                StaffId =
                                    staffId,

                                DeployedByUserId =
                                    clerkUserId,

                                DeployedDate =
                                    DateTime.UtcNow
                            });
                }

                funeral.StaffRequired =
                    StaffPerFuneral;

                funeral.UpdatedDate =
                    DateTime.UtcNow;

                _context.SaveChanges();

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();

                throw;
            }

            return GetById(
                funeralRequestId)
                ?? throw new InvalidOperationException(
                    "Unable to reload the funeral request.");
        }

        // ============================================================
        // CLERK REVIEW
        // ============================================================

        public FuneralRequest Review(
            string clerkUserId,
            string funeralRequestId,
            ReviewFuneralRequestRequest request)
        {
            var funeral =
                _context.FuneralRequests
                    .Include(x =>
                        x.StaffDeployments)
                    .FirstOrDefault(x =>
                        x.FuneralRequestId ==
                        funeralRequestId);

            if (funeral == null)
            {
                throw new KeyNotFoundException(
                    "Funeral request not found.");
            }

            if (!string.Equals(
                    funeral.Status,
                    "Pending",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Only pending funeral requests can be reviewed.");
            }

            var action =
                (request.Action ?? "")
                    .Trim()
                    .ToLowerInvariant();

            // ========================================================
            // REJECT
            // ========================================================

            if (action ==
                "reject")
            {
                if (string.IsNullOrWhiteSpace(
                    request.RejectionReason))
                {
                    throw new InvalidOperationException(
                        "A rejection reason is required.");
                }

                funeral.Status =
                    "Rejected";

                funeral.RejectionReason =
                    request.RejectionReason.Trim();

                funeral.ApprovedByClerkId =
                    clerkUserId;

                funeral.ApprovedDate =
                    null;

                funeral.UpdatedDate =
                    DateTime.UtcNow;

                SynchronizeServiceRequestStatus(
                    funeral.FuneralRequestId,
                    "Rejected");

                _context.SaveChanges();

                return funeral;
            }

            // ========================================================
            // APPROVE
            // ========================================================

            if (action !=
                "approve")
            {
                throw new InvalidOperationException(
                    "Action must be either Approve or Reject.");
            }

            // --------------------------------------------------------
            // EXACTLY 4 STAFF MUST ALREADY BE ASSIGNED
            // --------------------------------------------------------

            var assignedStaffCount =
                funeral.StaffDeployments
                    .Select(x =>
                        x.StaffId)
                    .Distinct()
                    .Count();

            if (assignedStaffCount !=
                StaffPerFuneral)
            {
                throw new InvalidOperationException(
                    $"Exactly {StaffPerFuneral} staff members must be assigned before this funeral can be approved. Currently assigned: {assignedStaffCount}.");
            }

            // --------------------------------------------------------
            // DAILY CAPACITY
            // --------------------------------------------------------

            var activeFunerals =
                _context.FuneralRequests
                    .Count(x =>
                        x.FuneralRequestId !=
                            funeral.FuneralRequestId &&

                        x.FuneralDate ==
                            funeral.FuneralDate &&

                        x.Status !=
                            "Rejected" &&

                        x.Status !=
                            "Cancelled");

            if (activeFunerals >=
                MaxFuneralsPerDay)
            {
                throw new InvalidOperationException(
                    "This funeral date has reached the maximum capacity of 6 funerals.");
            }

            // --------------------------------------------------------
            // APPROVE
            // --------------------------------------------------------

            funeral.Status =
                "Approved";

            funeral.StaffRequired =
                StaffPerFuneral;

            funeral.ApprovedByClerkId =
                clerkUserId;

            funeral.ApprovedDate =
                DateTime.UtcNow;

            funeral.RejectionReason =
                null;

            funeral.UpdatedDate =
                DateTime.UtcNow;

            SynchronizeServiceRequestStatus(
                funeral.FuneralRequestId,
                "Approved");

            _context.SaveChanges();

            return funeral;
        }

        // ============================================================
        // SERVICE REQUEST SYNCHRONIZATION
        // ============================================================

        private void SynchronizeServiceRequestStatus(
            string funeralRequestId,
            string status)
        {
            var serviceRequest =
                _context.ServiceRequests
                    .FirstOrDefault(x =>
                        x.FuneralRequestId ==
                        funeralRequestId);

            if (serviceRequest == null)
            {
                return;
            }

            serviceRequest.Status =
                status;

            serviceRequest.UpdatedDate =
                DateTime.UtcNow;
        }

        // ============================================================
        // OPERATIONAL ROLE
        // ============================================================

        private static bool IsOperationalRole(
            StaffType role)
        {
            return role ==
                       StaffType.Driver ||
                   role ==
                       StaffType.GraveDigger ||
                   role ==
                       StaffType.MortuaryAttendant ||
                   role ==
                       StaffType.OnSiteStaff;
        }

        // ============================================================
        // DESCRIPTION
        // ============================================================

        private static string BuildDescription(
            FuneralRequest funeral)
        {
            var type =
                string.IsNullOrWhiteSpace(
                    funeral.FuneralType)
                    ? "Standard"
                    : funeral.FuneralType;

            var venue =
                string.IsNullOrWhiteSpace(
                    funeral.Venue)
                    ? "Venue not specified"
                    : funeral.Venue;

            return
                $"{type} funeral on " +
                $"{funeral.FuneralDate:dd MMM yyyy} at " +
                $"{funeral.FuneralTime:hh\\:mm}. " +
                $"Venue: {venue}. " +
                $"LegacyCare staff required: {StaffPerFuneral}.";
        }
    }
}
