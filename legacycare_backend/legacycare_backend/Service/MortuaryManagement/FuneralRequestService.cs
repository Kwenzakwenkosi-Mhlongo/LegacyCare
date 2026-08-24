using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class FuneralRequestService
        : IFuneralRequestService
    {
        private readonly AppDbContext _context;

        private const int MAX_FUNERALS_PER_DAY = 6;

        private const int DEFAULT_STAFF_PER_FUNERAL = 5;

        private const int MAX_OPERATIONAL_STAFF = 30;

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
                    .FirstOrDefault(x =>
                        x.DeathNotificationId ==
                        request.DeathNotificationId);

            if (notification == null)
            {
                throw new KeyNotFoundException(
                    "Death notification not found.");
            }

            // --------------------------------------------------------
            // SECURITY
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
            // APPROVED DEATH NOTIFICATION
            // --------------------------------------------------------

            if (notification.Status !=
                DeathNotificationStatus.Approved)
            {
                throw new InvalidOperationException(
                    "A funeral can only be requested after the death notification has been approved.");
            }

            // --------------------------------------------------------
            // DUPLICATE
            // --------------------------------------------------------

            var alreadyExists =
                _context.FuneralRequests
                    .Any(x =>
                        x.DeathNotificationId ==
                        request.DeathNotificationId);

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
                    .FirstOrDefault(c =>
                        c.UserId == userId);

            if (client == null)
            {
                throw new InvalidOperationException(
                    "Client account was not found.");
            }

            // --------------------------------------------------------
            // DATE/TIME
            // --------------------------------------------------------

            var funeralDate =
                request.FuneralDate.Date;

            var funeralDateTime =
                funeralDate +
                request.FuneralTime;

            if (funeralDateTime <= DateTime.Now)
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
            // DAILY FUNERAL CAPACITY
            // --------------------------------------------------------

            var funeralCount =
                _context.FuneralRequests
                    .Count(x =>
                        x.FuneralDate == funeralDate &&
                        x.Status != "Rejected" &&
                        x.Status != "Cancelled");

            if (funeralCount >=
                MAX_FUNERALS_PER_DAY)
            {
                throw new InvalidOperationException(
                    "This funeral date is fully booked. LegacyCare can accommodate a maximum of 6 funerals per day. Please select another date.");
            }

            // --------------------------------------------------------
            // CHECK OPERATIONAL STAFF
            // --------------------------------------------------------
            //
            // We don't assign staff here.
            //
            // The Clerk does that later.
            //
            // This check makes sure the company has enough operational
            // staff to support the 6-funeral daily capacity.
            // --------------------------------------------------------

            var operationalStaffCount =
                _context.Staff
                    .Include(x => x.User)
                    .Count(x =>
                        x.User != null &&
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
                        ));

            if (operationalStaffCount <
                DEFAULT_STAFF_PER_FUNERAL)
            {
                throw new InvalidOperationException(
                    "There are currently not enough active operational staff to accept a funeral request.");
            }

            // --------------------------------------------------------
            // CREATE
            // --------------------------------------------------------

            var funeralRequest =
                new FuneralRequest
                {
                    DeathNotificationId =
                        notification.DeathNotificationId,

                    ClientId =
                        client.ClientId!,

                    BranchId =
                        client.BranchId ??
                        notification.BranchId,

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
                        DEFAULT_STAFF_PER_FUNERAL,

                    CreatedDate =
                        DateTime.Now,

                    UpdatedDate =
                        DateTime.Now
                };

            _context.FuneralRequests
                .Add(funeralRequest);

            _context.SaveChanges();

            return funeralRequest;
        }

        // ============================================================
        // CLIENT REQUESTS
        // ============================================================

        public IEnumerable<FuneralRequest>
            GetByClientUserId(string userId)
        {
            var client =
                _context.Client
                    .FirstOrDefault(c =>
                        c.UserId == userId);

            if (client == null)
            {
                return Enumerable.Empty<FuneralRequest>();
            }

            return _context.FuneralRequests
                .Include(x => x.DeathNotification)
                .Include(x => x.Branch)
                .Include(x => x.StaffDeployments)
                    .ThenInclude(x => x.Staff)
                        .ThenInclude(x => x!.User)
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

        public FuneralRequest?
            GetById(string funeralRequestId)
        {
            return _context.FuneralRequests
                .Include(x => x.DeathNotification)
                .Include(x => x.Client)
                .Include(x => x.Branch)
                .Include(x => x.StaffDeployments)
                    .ThenInclude(x => x.Staff)
                        .ThenInclude(x => x!.User)
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
                .Include(x => x.Client)
                .Include(x => x.DeathNotification)
                .Include(x => x.Branch)
                .Where(x =>
                    x.Status == "Pending")
                .OrderBy(x =>
                    x.FuneralDate)
                .ThenBy(x =>
                    x.FuneralTime)
                .ToList();
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
                    .ToLower();

            // ========================================================
            // REJECT
            // ========================================================

            if (action == "reject")
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

                funeral.UpdatedDate =
                    DateTime.Now;

                _context.SaveChanges();

                return funeral;
            }

            // ========================================================
            // APPROVE
            // ========================================================

            if (action != "approve")
            {
                throw new InvalidOperationException(
                    "Action must be either Approve or Reject.");
            }

            // --------------------------------------------------------
            // STAFF REQUIRED
            // --------------------------------------------------------

            if (request.StaffRequired <= 0)
            {
                throw new InvalidOperationException(
                    "The number of staff required must be greater than zero.");
            }

            if (request.StaffRequired > 5)
            {
                throw new InvalidOperationException(
                    "A maximum of 5 operational staff can be assigned to a funeral.");
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

                        x.Status != "Rejected" &&
                        x.Status != "Cancelled");

            if (activeFunerals >=
                MAX_FUNERALS_PER_DAY)
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
                request.StaffRequired;

            funeral.ApprovedByClerkId =
                clerkUserId;

            funeral.ApprovedDate =
                DateTime.Now;

            funeral.RejectionReason =
                null;

            funeral.UpdatedDate =
                DateTime.Now;

            _context.SaveChanges();

            return funeral;
        }
    }
}