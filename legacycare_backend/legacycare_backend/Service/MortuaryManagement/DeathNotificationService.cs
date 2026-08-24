using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class DeathNotificationService : IDeathNotificationService
    {
        private readonly AppDbContext _context;

        public DeathNotificationService(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CREATE
        // =========================================================

        public DeathNotification CreateNotification(
            DeathNotification notification)
        {
            if (notification == null)
            {
                throw new ArgumentNullException(nameof(notification));
            }

            if (string.IsNullOrWhiteSpace(notification.BranchId))
            {
                throw new InvalidOperationException(
                    "A branch must be assigned before creating a death notification.");
            }

            _context.DeathNotifications.Add(notification);

            _context.SaveChanges();

            return notification;
        }

        // =========================================================
        // GET BY ID
        // =========================================================

        public DeathNotification? GetById(
            string notificationId)
        {
            if (string.IsNullOrWhiteSpace(notificationId))
            {
                return null;
            }

            return _context.DeathNotifications
                .Include(x => x.Policy)
                .Include(x => x.Beneficiary)
                .Include(x => x.ReportedByUser)
                .Include(x => x.Branch)
                .Include(x => x.VerifiedBy)
                .FirstOrDefault(
                    x => x.DeathNotificationId == notificationId);
        }

        // =========================================================
        // GET ALL
        // =========================================================

        public IEnumerable<DeathNotification> GetAll()
        {
            return _context.DeathNotifications
                .Include(x => x.Policy)
                .Include(x => x.Beneficiary)
                .Include(x => x.ReportedByUser)
                .Include(x => x.Branch)
                .Include(x => x.VerifiedBy)
                .OrderByDescending(x => x.DateReported)
                .ToList();
        }

        // =========================================================
        // GET BY POLICY
        // =========================================================

        public IEnumerable<DeathNotification> GetByPolicy(
            string policyId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                return Enumerable.Empty<DeathNotification>();
            }

            return _context.DeathNotifications
                .Include(x => x.Policy)
                .Include(x => x.Beneficiary)
                .Include(x => x.ReportedByUser)
                .Include(x => x.Branch)
                .Include(x => x.VerifiedBy)
                .Where(x => x.PolicyId == policyId)
                .OrderByDescending(x => x.DateReported)
                .ToList();
        }

        // =========================================================
        // GET BY BRANCH
        // =========================================================

        public IEnumerable<DeathNotification> GetByBranch(
            string branchId)
        {
            if (string.IsNullOrWhiteSpace(branchId))
            {
                return Enumerable.Empty<DeathNotification>();
            }

            return _context.DeathNotifications
                .Include(x => x.Policy)
                .Include(x => x.Beneficiary)
                .Include(x => x.ReportedByUser)
                .Include(x => x.Branch)
                .Include(x => x.VerifiedBy)
                .Where(x => x.BranchId == branchId)
                .OrderByDescending(x => x.DateReported)
                .ToList();
        }

        // =========================================================
        // APPROVE
        // =========================================================

        public void Approve(
            string notificationId,
            string verifiedByUserId)
        {
            if (string.IsNullOrWhiteSpace(notificationId))
            {
                throw new ArgumentException(
                    "Death notification ID is required.",
                    nameof(notificationId));
            }

            if (string.IsNullOrWhiteSpace(verifiedByUserId))
            {
                throw new ArgumentException(
                    "Verified-by user ID is required.",
                    nameof(verifiedByUserId));
            }

            // =====================================================
            // SQL SERVER RETRY STRATEGY
            // =====================================================

            var strategy =
                _context.Database.CreateExecutionStrategy();

            strategy.Execute(() =>
            {
                using var transaction =
                    _context.Database.BeginTransaction();

                try
                {
                    // =================================================
                    // GET DEATH NOTIFICATION
                    // =================================================

                    var notification =
                        _context.DeathNotifications
                            .Include(x => x.Beneficiary)
                            .Include(x => x.Policy)
                            .Include(x => x.Branch)
                            .FirstOrDefault(
                                x =>
                                    x.DeathNotificationId ==
                                    notificationId);

                    if (notification == null)
                    {
                        throw new KeyNotFoundException(
                            "Death notification not found.");
                    }

                    // =================================================
                    // VALIDATE BENEFICIARY
                    // =================================================

                    var beneficiary =
                        notification.Beneficiary;

                    if (beneficiary == null)
                    {
                        throw new InvalidOperationException(
                            "Beneficiary associated with this death notification was not found.");
                    }

                    // =================================================
                    // VALIDATE POLICY
                    // =================================================

                    if (notification.Policy == null)
                    {
                        throw new InvalidOperationException(
                            "Policy associated with this death notification was not found.");
                    }

                    // =================================================
                    // VALIDATE BRANCH
                    // =================================================

                    if (string.IsNullOrWhiteSpace(
                        notification.BranchId))
                    {
                        throw new InvalidOperationException(
                            "This death notification has no branch assigned.");
                    }

                    // =================================================
                    // CHECK NOTIFICATION STATUS
                    // =================================================

                    var notificationStatus =
                        notification.Status
                            .ToString()
                            .Trim();

                    if (notificationStatus.Equals(
                        "Approved",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException(
                            "This death notification has already been approved.");
                    }

                    if (notificationStatus.Equals(
                        "Rejected",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException(
                            "A rejected death notification cannot be approved.");
                    }

                    // =================================================
                    // LOG INFORMATION
                    // =================================================

                    Console.WriteLine(
                        "========================================");

                    Console.WriteLine(
                        "[DeathNotification] APPROVAL START");

                    Console.WriteLine(
                        $"Notification ID: {notification.DeathNotificationId}");

                    Console.WriteLine(
                        $"Beneficiary ID: {beneficiary.BeneficiaryId}");

                    Console.WriteLine(
                        $"Beneficiary Name: {beneficiary.FullName}");

                    Console.WriteLine(
                        $"Beneficiary ID Number: {beneficiary.IDNumber}");

                    Console.WriteLine(
                        $"Beneficiary DOB: {beneficiary.DateOfBirth}");

                    Console.WriteLine(
                        $"Beneficiary Gender: [{beneficiary.Gender}]");

                    Console.WriteLine(
                        $"Beneficiary Status: {beneficiary.Status}");

                    Console.WriteLine(
                        "========================================");

                    // =================================================
                    // GET GENDER
                    // =================================================

                    string? genderValue = null;

                    if (beneficiary.Gender != null)
                    {
                        genderValue =
                            beneficiary.Gender
                                .ToString()
                                .Trim();
                    }

                    // =================================================
                    // VALIDATE GENDER
                    // =================================================

                    if (string.IsNullOrWhiteSpace(genderValue))
                    {
                        throw new InvalidOperationException(
                            "The selected beneficiary has no gender recorded. Please update the beneficiary gender before approving this death notification.");
                    }

                    // =================================================
                    // NORMALIZE GENDER
                    // =================================================

                    if (genderValue.Equals(
                        "Male",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        genderValue = "Male";
                    }
                    else if (genderValue.Equals(
                        "Female",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        genderValue = "Female";
                    }
                    else
                    {
                        throw new InvalidOperationException(
                            $"The beneficiary gender value '{genderValue}' is not valid. Expected Male or Female.");
                    }

                    // =================================================
                    // BENEFICIARY STATUS
                    // =================================================

                    var beneficiaryStatus =
                        beneficiary.Status
                            .ToString()
                            .Trim();

                    if (beneficiaryStatus.Equals(
                        "Removed",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidOperationException(
                            "A removed beneficiary cannot be marked as deceased.");
                    }

                    // =================================================
                    // CHECK EXISTING DECEASED RECORD
                    // =================================================

                    var existingDeceased =
                        _context.Deceased
                            .FirstOrDefault(
                                x =>
                                    x.BeneficiaryId ==
                                    beneficiary.BeneficiaryId);

                    // =================================================
                    // APPROVE NOTIFICATION
                    // =================================================

                    notification.Approve(
                        verifiedByUserId);

                    // =================================================
                    // MARK BENEFICIARY AS DECEASED
                    //
                    // If already Deceased, do not call
                    // MarkAsDeceased() again.
                    // =================================================

                    if (!beneficiaryStatus.Equals(
                        "Deceased",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        beneficiary.MarkAsDeceased();

                        Console.WriteLine(
                            $"Beneficiary {beneficiary.BeneficiaryId} marked as Deceased.");
                    }
                    else
                    {
                        Console.WriteLine(
                            $"Beneficiary {beneficiary.BeneficiaryId} was already Deceased.");
                    }

                    // =================================================
                    // CREATE DECEASED RECORD ONLY IF IT DOES NOT EXIST
                    // =================================================

                    if (existingDeceased == null)
                    {
                        var deceased =
                            new Deceased(
                                beneficiary.FullName,
                                beneficiary.IDNumber,
                                beneficiary.DateOfBirth,
                                notification.DateOfDeath,
                                genderValue,
                                notification.PolicyId,
                                beneficiary.BeneficiaryId,
                                null
                            );

                        _context.Deceased.Add(deceased);

                        Console.WriteLine(
                            $"Created new Deceased record for beneficiary {beneficiary.BeneficiaryId}.");
                    }
                    else
                    {
                        Console.WriteLine(
                            $"Deceased record already exists for beneficiary {beneficiary.BeneficiaryId}.");

                        Console.WriteLine(
                            "Existing Deceased record will NOT be duplicated.");
                    }

                    // =================================================
                    // SAVE
                    // =================================================

                    _context.SaveChanges();

                    // =================================================
                    // COMMIT
                    // =================================================

                    transaction.Commit();

                    // =================================================
                    // SUCCESS
                    // =================================================

                    Console.WriteLine(
                        "========================================");

                    Console.WriteLine(
                        "[DeathNotification] APPROVAL SUCCESS");

                    Console.WriteLine(
                        $"Notification: {notification.DeathNotificationId}");

                    Console.WriteLine(
                        $"Beneficiary: {beneficiary.BeneficiaryId}");

                    Console.WriteLine(
                        $"Gender: {genderValue}");

                    Console.WriteLine(
                        $"Beneficiary Status: {beneficiary.Status}");

                    Console.WriteLine(
                        existingDeceased == null
                            ? "Deceased record CREATED."
                            : "Existing Deceased record REUSED.");

                    Console.WriteLine(
                        "========================================");
                }
                catch
                {
                    transaction.Rollback();

                    throw;
                }
            });
        }

        // =========================================================
        // REJECT
        // =========================================================

        public void Reject(
            string notificationId,
            string verifiedByUserId,
            string reason)
        {
            if (string.IsNullOrWhiteSpace(notificationId))
            {
                throw new ArgumentException(
                    "Death notification ID is required.",
                    nameof(notificationId));
            }

            if (string.IsNullOrWhiteSpace(verifiedByUserId))
            {
                throw new ArgumentException(
                    "Verified-by user ID is required.",
                    nameof(verifiedByUserId));
            }

            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new ArgumentException(
                    "A rejection reason is required.",
                    nameof(reason));
            }

            // =====================================================
            // GET NOTIFICATION
            // =====================================================

            var notification =
                _context.DeathNotifications
                    .Include(x => x.Beneficiary)
                    .FirstOrDefault(
                        x =>
                            x.DeathNotificationId ==
                            notificationId);

            if (notification == null)
            {
                throw new KeyNotFoundException(
                    "Death notification not found.");
            }

            // =====================================================
            // CHECK STATUS
            // =====================================================

            var status =
                notification.Status
                    .ToString()
                    .Trim();

            if (status.Equals(
                "Approved",
                StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "An approved death notification cannot be rejected.");
            }

            if (status.Equals(
                "Rejected",
                StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "This death notification has already been rejected.");
            }

            // =====================================================
            // REJECT
            // =====================================================

            notification.Reject(
                verifiedByUserId,
                reason);

            // =====================================================
            // IMPORTANT
            //
            // Rejection DOES NOT:
            //
            // - Mark beneficiary as Deceased
            // - Create Deceased record
            //
            // Beneficiary remains unchanged.
            // =====================================================

            _context.SaveChanges();

            Console.WriteLine(
                "========================================");

            Console.WriteLine(
                "[DeathNotification] REJECTION SUCCESS");

            Console.WriteLine(
                $"Notification: {notification.DeathNotificationId}");

            Console.WriteLine(
                $"Beneficiary: {notification.BeneficiaryId}");

            Console.WriteLine(
                "Beneficiary was NOT changed.");

            Console.WriteLine(
                "========================================");
        }
    }
}