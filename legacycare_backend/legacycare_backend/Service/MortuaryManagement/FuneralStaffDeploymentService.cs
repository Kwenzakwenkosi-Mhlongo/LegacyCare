// ============================================================
// FILE:
// Service/MortuaryManagement/FuneralStaffDeploymentService.cs
// ============================================================

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class FuneralStaffDeploymentService
        : IFuneralStaffDeploymentService
    {
        private const int StaffPerFuneral = 4;

        private readonly AppDbContext _context;

        public FuneralStaffDeploymentService(
            AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET DEPLOYED STAFF
        // ============================================================

        public IEnumerable<FuneralStaffDeployment>
            GetByFuneralRequest(
                string funeralRequestId)
        {
            if (string.IsNullOrWhiteSpace(
                funeralRequestId))
            {
                throw new ArgumentException(
                    "Funeral request ID is required.",
                    nameof(funeralRequestId));
            }

            return _context
                .FuneralStaffDeployments
                .Include(x => x.Staff)
                    .ThenInclude(x =>
                        x!.User)
                .Include(x => x.Staff)
                    .ThenInclude(x =>
                        x!.Branch)
                .Where(x =>
                    x.FuneralRequestId ==
                    funeralRequestId)
                .OrderBy(x =>
                    x.Staff!.User.FullName)
                .ToList();
        }

        // ============================================================
        // GET AVAILABLE STAFF
        //
        // Only:
        // - active staff
        // - same branch as funeral
        // - operational roles
        // - not booked for another funeral at same date/time
        // ============================================================

        public IEnumerable<object>
            GetAvailableStaff(
                string funeralRequestId,
                int requiredStaff)
        {
            if (string.IsNullOrWhiteSpace(
                funeralRequestId))
            {
                throw new ArgumentException(
                    "Funeral request ID is required.",
                    nameof(funeralRequestId));
            }

            var funeral =
                _context.FuneralRequests
                    .Include(x =>
                        x.Branch)
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
                    "This funeral has no LegacyCare branch assigned.");
            }

            if (string.Equals(
                    funeral.Status,
                    "Rejected",
                    StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    funeral.Status,
                    "Cancelled",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Staff cannot be assigned to a rejected or cancelled funeral.");
            }

            // LegacyCare rule is fixed at 4.
            requiredStaff =
                StaffPerFuneral;

            var deployedToThisFuneral =
                _context
                    .FuneralStaffDeployments
                    .Where(x =>
                        x.FuneralRequestId ==
                        funeralRequestId)
                    .Select(x =>
                        x.StaffId)
                    .ToHashSet();

            // Staff are considered unavailable when they are assigned
            // to another active funeral at the same date and time.

            var busyStaffIds =
                _context
                    .FuneralStaffDeployments
                    .Where(x =>
                        x.FuneralRequestId !=
                            funeralRequestId &&

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
                    .ToHashSet();

            var staff =
                _context.Staff
                    .Include(x =>
                        x.User)
                    .Include(x =>
                        x.Branch)
                    .Where(x =>
                        x.BranchId ==
                            funeral.BranchId &&
                        x.User.IsActive)
                    .AsEnumerable()
                    .Where(x =>
                        IsOperationalRole(
                            x.StaffRole))
                    .Where(x =>
                        deployedToThisFuneral
                            .Contains(
                                x.StaffId) ||
                        !busyStaffIds
                            .Contains(
                                x.StaffId))
                    .Select(x => new
                    {
                        staffId =
                            x.StaffId,

                        displayStaffId =
                            x.DisplayStaffId,

                        fullName =
                            x.User.FullName,

                        role =
                            x.StaffRole.ToString(),

                        branchId =
                            x.BranchId,

                        branchName =
                            x.Branch?.BranchName,

                        isAlreadyDeployed =
                            deployedToThisFuneral
                                .Contains(
                                    x.StaffId)
                    })
                    .OrderBy(x =>
                        x.fullName)
                    .ToList();

            return staff;
        }

        // ============================================================
        // DEPLOY / ASSIGN EXACTLY 4 STAFF
        //
        // Staff assignment happens while funeral is Pending.
        // Approval happens AFTER all 4 staff have been assigned.
        // ============================================================

        public IEnumerable<FuneralStaffDeployment>
            DeployStaff(
                string deployedByUserId,
                string funeralRequestId,
                DeployFuneralStaffRequest request)
        {
            if (string.IsNullOrWhiteSpace(
                deployedByUserId))
            {
                throw new ArgumentException(
                    "Deploying user ID is required.",
                    nameof(deployedByUserId));
            }

            if (string.IsNullOrWhiteSpace(
                funeralRequestId))
            {
                throw new ArgumentException(
                    "Funeral request ID is required.",
                    nameof(funeralRequestId));
            }

            if (request == null)
            {
                throw new InvalidOperationException(
                    "Staff selection is required.");
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

            // --------------------------------------------------------
            // STAFF MUST BE ASSIGNED BEFORE APPROVAL
            // --------------------------------------------------------

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
                    "This funeral has no LegacyCare branch assigned.");
            }

            // --------------------------------------------------------
            // EXACTLY FOUR UNIQUE STAFF IDS
            // --------------------------------------------------------

            var requestedStaffIds =
                (request.StaffIds ??
                 [])
                .Where(x =>
                    !string.IsNullOrWhiteSpace(
                        x))
                .Select(x =>
                    x.Trim())
                .Distinct(
                    StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (requestedStaffIds.Count !=
                StaffPerFuneral)
            {
                throw new InvalidOperationException(
                    $"Exactly {StaffPerFuneral} staff members must be selected.");
            }

            // --------------------------------------------------------
            // LOAD STAFF
            // --------------------------------------------------------

            var staffMembers =
                _context.Staff
                    .Include(x =>
                        x.User)
                    .Include(x =>
                        x.Branch)
                    .Where(x =>
                        requestedStaffIds
                            .Contains(
                                x.StaffId))
                    .ToList();

            if (staffMembers.Count !=
                StaffPerFuneral)
            {
                throw new InvalidOperationException(
                    "One or more selected staff members could not be found.");
            }

            // --------------------------------------------------------
            // VALIDATE STAFF
            // --------------------------------------------------------

            foreach (var staff
                     in staffMembers)
            {
                if (!string.Equals(
                        staff.BranchId,
                        funeral.BranchId,
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        $"Staff member {staff.DisplayStaffId} does not belong to funeral branch {funeral.BranchId}.");
                }

                if (staff.User == null ||
                    !staff.User.IsActive)
                {
                    throw new InvalidOperationException(
                        $"Staff member {staff.DisplayStaffId} is inactive.");
                }

                if (!IsOperationalRole(
                        staff.StaffRole))
                {
                    throw new InvalidOperationException(
                        $"Staff member {staff.DisplayStaffId} is not operational funeral staff.");
                }
            }

            // --------------------------------------------------------
            // DOUBLE-BOOKING CHECK
            // --------------------------------------------------------

            var conflictingStaffIds =
                _context
                    .FuneralStaffDeployments
                    .Where(x =>
                        requestedStaffIds
                            .Contains(
                                x.StaffId) &&

                        x.FuneralRequestId !=
                            funeralRequestId &&

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
                var conflicts =
                    string.Join(
                        ", ",
                        conflictingStaffIds);

                throw new InvalidOperationException(
                    $"The following staff members are already assigned to another funeral at the same time: {conflicts}.");
            }

            using var transaction =
                _context.Database
                    .BeginTransaction();

            try
            {
                // ----------------------------------------------------
                // REPLACE EXISTING PENDING ASSIGNMENT
                // ----------------------------------------------------

                var existingDeployments =
                    _context
                        .FuneralStaffDeployments
                        .Where(x =>
                            x.FuneralRequestId ==
                            funeralRequestId)
                        .ToList();

                if (existingDeployments.Count >
                    0)
                {
                    _context
                        .FuneralStaffDeployments
                        .RemoveRange(
                            existingDeployments);
                }

                // ----------------------------------------------------
                // CREATE FOUR DEPLOYMENTS
                // ----------------------------------------------------

                foreach (var staffId
                         in requestedStaffIds)
                {
                    _context
                        .FuneralStaffDeployments
                        .Add(
                            new FuneralStaffDeployment
                            {
                                FuneralRequestId =
                                    funeralRequestId,

                                StaffId =
                                    staffId,

                                DeployedByUserId =
                                    deployedByUserId,

                                DeployedDate =
                                    DateTime.UtcNow
                            });
                }

                // Do NOT change the funeral to "Staff Deployed".
                // It must remain Pending until the clerk approves it.

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

            return GetByFuneralRequest(
                funeralRequestId);
        }

        // ============================================================
        // REMOVE STAFF DEPLOYMENT
        // ============================================================

        public void RemoveDeployment(
            string deployedByUserId,
            int deploymentId)
        {
            if (string.IsNullOrWhiteSpace(
                deployedByUserId))
            {
                throw new ArgumentException(
                    "User ID is required.",
                    nameof(deployedByUserId));
            }

            var deployment =
                _context
                    .FuneralStaffDeployments
                    .Include(x =>
                        x.FuneralRequest)
                    .FirstOrDefault(x =>
                        x.FuneralStaffDeploymentId ==
                        deploymentId);

            if (deployment == null)
            {
                throw new KeyNotFoundException(
                    "Staff deployment was not found.");
            }

            if (deployment.FuneralRequest ==
                null)
            {
                throw new InvalidOperationException(
                    "The funeral associated with this deployment could not be found.");
            }

            // Once approved, staffing should be treated as locked.
            // Changes can be added later as an Admin-only workflow.

            if (!string.Equals(
                    deployment.FuneralRequest.Status,
                    "Pending",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Staff assignments can only be changed while the funeral request is pending.");
            }

            _context
                .FuneralStaffDeployments
                .Remove(
                    deployment);

            deployment
                .FuneralRequest
                .UpdatedDate =
                    DateTime.UtcNow;

            _context.SaveChanges();
        }

        // ============================================================
        // OPERATIONAL STAFF ROLE
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
    }
}