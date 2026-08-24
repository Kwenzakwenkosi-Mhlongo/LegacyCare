using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class FuneralStaffDeploymentService
        : IFuneralStaffDeploymentService
    {
        private readonly AppDbContext _context;

        public FuneralStaffDeploymentService(
            AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET DEPLOYED STAFF FOR A FUNERAL
        // ============================================================

        public IEnumerable<FuneralStaffDeployment>
            GetByFuneralRequest(
                string funeralRequestId)
        {
            return _context.Set<FuneralStaffDeployment>()
                .Include(x => x.Staff)
                    .ThenInclude(x => x!.User)
                .Where(x =>
                    x.FuneralRequestId ==
                    funeralRequestId)
                .OrderBy(x => x.StaffId)
                .ToList();
        }

        // ============================================================
        // GET AVAILABLE OPERATIONAL STAFF
        // ============================================================

        public IEnumerable<object> GetAvailableStaff(
            string funeralRequestId,
            int requiredStaff)
        {
            // --------------------------------------------------------
            // FIND FUNERAL
            // --------------------------------------------------------

            var funeral =
                _context.Set<FuneralRequest>()
                    .FirstOrDefault(x =>
                        x.FuneralRequestId ==
                        funeralRequestId);

            if (funeral == null)
            {
                throw new KeyNotFoundException(
                    "Funeral request not found.");
            }

            // --------------------------------------------------------
            // VALIDATE STAFF COUNT
            // --------------------------------------------------------

            if (requiredStaff <= 0)
            {
                throw new InvalidOperationException(
                    "The number of staff required must be greater than zero.");
            }

            if (requiredStaff > 30)
            {
                throw new InvalidOperationException(
                    "The number of staff cannot exceed the 30 available operational staff.");
            }

            // --------------------------------------------------------
            // STAFF ALREADY DEPLOYED TO THIS FUNERAL
            // --------------------------------------------------------

            var deployedStaffIds =
                _context.Set<FuneralStaffDeployment>()
                    .Where(x =>
                        x.FuneralRequestId ==
                        funeralRequestId)
                    .Select(x => x.StaffId)
                    .ToHashSet();

            // --------------------------------------------------------
            // STAFF BUSY ON SAME FUNERAL DATE
            // --------------------------------------------------------

            var busyStaffIds =
                _context.Set<FuneralStaffDeployment>()
                    .Include(x => x.FuneralRequest)
                    .Where(x =>
                        x.FuneralRequest != null &&
                        x.FuneralRequest.FuneralDate.Date ==
                        funeral.FuneralDate.Date)
                    .Select(x => x.StaffId)
                    .ToHashSet();

            // --------------------------------------------------------
            // OPERATIONAL STAFF
            //
            // We exclude:
            // Admin
            // Clerk
            //
            // because only operational staff should be deployed.
            // --------------------------------------------------------

            var availableStaff =
                _context.Staff
                    .Include(x => x.User)
                    .Where(x =>
                        x.User != null &&
                        x.User.IsActive)
                    .AsEnumerable()
                    .Where(x =>
                        x.StaffRole.ToString()
                            != "Admin" &&
                        x.StaffRole.ToString()
                            != "Clerk")
                    .Where(x =>
                        !busyStaffIds.Contains(x.StaffId) ||
                        deployedStaffIds.Contains(x.StaffId))
                    .Select(x => new
                    {
                        staffId = x.StaffId,

                        displayStaffId =
                            x.DisplayStaffId,

                        fullName =
                            x.User.FullName,

                        role =
                            x.StaffRole.ToString(),

                        branchId =
                            x.BranchId,

                        isAlreadyDeployed =
                            deployedStaffIds.Contains(
                                x.StaffId)
                    })
                    .OrderBy(x =>
                        x.fullName)
                    .ToList();

            return availableStaff;
        }

        // ============================================================
        // DEPLOY STAFF
        // ============================================================

        public IEnumerable<FuneralStaffDeployment>
            DeployStaff(
                string deployedByUserId,
                string funeralRequestId,
                DeployFuneralStaffRequest request)
        {
            // --------------------------------------------------------
            // FIND FUNERAL
            // --------------------------------------------------------

            var funeral =
                _context.Set<FuneralRequest>()
                    .FirstOrDefault(x =>
                        x.FuneralRequestId ==
                        funeralRequestId);

            if (funeral == null)
            {
                throw new KeyNotFoundException(
                    "Funeral request not found.");
            }

            // --------------------------------------------------------
            // FUNERAL MUST BE APPROVED
            // --------------------------------------------------------

            if (!string.Equals(
                    funeral.Status,
                    "Approved",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Staff can only be deployed to an approved funeral.");
            }

            // --------------------------------------------------------
            // STAFF IDS REQUIRED
            // --------------------------------------------------------

            if (request.StaffIds == null ||
                request.StaffIds.Count == 0)
            {
                throw new InvalidOperationException(
                    "At least one staff member must be selected.");
            }

            // --------------------------------------------------------
            // REMOVE DUPLICATES
            // --------------------------------------------------------

            var requestedStaffIds =
                request.StaffIds
                    .Where(x =>
                        !string.IsNullOrWhiteSpace(x))
                    .Select(x =>
                        x.Trim())
                    .Distinct(
                        StringComparer.OrdinalIgnoreCase)
                    .ToList();

            // --------------------------------------------------------
            // EXACT NUMBER REQUIRED
            // --------------------------------------------------------

            if (requestedStaffIds.Count !=
                funeral.StaffRequired)
            {
                throw new InvalidOperationException(
                    $"Exactly {funeral.StaffRequired} staff members must be selected.");
            }

            // --------------------------------------------------------
            // FIND STAFF
            // --------------------------------------------------------

            var staffMembers =
                _context.Staff
                    .Include(x => x.User)
                    .Where(x =>
                        requestedStaffIds.Contains(
                            x.StaffId))
                    .ToList();

            if (staffMembers.Count !=
                requestedStaffIds.Count)
            {
                throw new InvalidOperationException(
                    "One or more selected staff members could not be found.");
            }

            // --------------------------------------------------------
            // CHECK ACTIVE
            // --------------------------------------------------------

            var inactiveStaff =
                staffMembers
                    .Where(x =>
                        x.User == null ||
                        !x.User.IsActive)
                    .ToList();

            if (inactiveStaff.Any())
            {
                throw new InvalidOperationException(
                    "One or more selected staff members are inactive.");
            }

            // --------------------------------------------------------
            // ONLY OPERATIONAL STAFF
            // --------------------------------------------------------

            var nonOperationalStaff =
                staffMembers
                    .Where(x =>
                        x.StaffRole.ToString() == "Admin" ||
                        x.StaffRole.ToString() == "Clerk")
                    .ToList();

            if (nonOperationalStaff.Any())
            {
                throw new InvalidOperationException(
                    "Only operational staff can be deployed to a funeral.");
            }

            // --------------------------------------------------------
            // STAFF ALREADY DEPLOYED TO THIS FUNERAL
            // --------------------------------------------------------

            var existingForThisFuneral =
                _context.Set<FuneralStaffDeployment>()
                    .Where(x =>
                        x.FuneralRequestId ==
                        funeralRequestId)
                    .Select(x =>
                        x.StaffId)
                    .ToHashSet();

            var alreadyAssigned =
                requestedStaffIds
                    .Where(x =>
                        existingForThisFuneral
                            .Contains(x))
                    .ToList();

            if (alreadyAssigned.Any())
            {
                throw new InvalidOperationException(
                    "One or more selected staff members are already deployed to this funeral.");
            }

            // --------------------------------------------------------
            // STAFF BUSY ON SAME DATE
            // --------------------------------------------------------

            var busyStaffIds =
                _context
                    .Set<FuneralStaffDeployment>()
                    .Include(x =>
                        x.FuneralRequest)
                    .Where(x =>
                        x.FuneralRequest != null &&
                        x.FuneralRequest.FuneralDate.Date ==
                        funeral.FuneralDate.Date)
                    .Select(x =>
                        x.StaffId)
                    .ToHashSet();

            var unavailableStaff =
                requestedStaffIds
                    .Where(x =>
                        busyStaffIds.Contains(x))
                    .ToList();

            if (unavailableStaff.Any())
            {
                throw new InvalidOperationException(
                    "One or more selected staff members are already deployed to another funeral on this date.");
            }

            // --------------------------------------------------------
            // CREATE DEPLOYMENTS
            // --------------------------------------------------------

            foreach (var staffId in requestedStaffIds)
            {
                var deployment =
                    new FuneralStaffDeployment
                    {
                        FuneralRequestId =
                            funeralRequestId,

                        StaffId =
                            staffId,

                        DeployedByUserId =
                            deployedByUserId,

                        DeployedDate =
                            DateTime.Now
                    };

                _context
                    .Set<FuneralStaffDeployment>()
                    .Add(deployment);
            }

            // --------------------------------------------------------
            // UPDATE FUNERAL STATUS
            // --------------------------------------------------------

            funeral.Status =
                "Staff Deployed";

            funeral.UpdatedDate =
                DateTime.Now;

            _context.SaveChanges();

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
            var deployment =
                _context
                    .Set<FuneralStaffDeployment>()
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

            if (deployment.FuneralRequest == null)
            {
                throw new InvalidOperationException(
                    "The funeral request associated with this deployment could not be found.");
            }

            // --------------------------------------------------------
            // ONLY APPROVED / DEPLOYED FUNERALS
            // --------------------------------------------------------

            if (
                !string.Equals(
                    deployment.FuneralRequest.Status,
                    "Approved",
                    StringComparison.OrdinalIgnoreCase)
                &&
                !string.Equals(
                    deployment.FuneralRequest.Status,
                    "Staff Deployed",
                    StringComparison.OrdinalIgnoreCase)
            )
            {
                throw new InvalidOperationException(
                    "Staff can only be removed from an approved or deployed funeral.");
            }

            // --------------------------------------------------------
            // REMOVE
            // --------------------------------------------------------

            _context
                .Set<FuneralStaffDeployment>()
                .Remove(deployment);

            // --------------------------------------------------------
            // CHECK REMAINING STAFF
            // --------------------------------------------------------

            var remainingStaff =
                _context
                    .Set<FuneralStaffDeployment>()
                    .Count(x =>
                        x.FuneralRequestId ==
                        deployment.FuneralRequestId &&
                        x.FuneralStaffDeploymentId !=
                        deploymentId);

            if (remainingStaff == 0)
            {
                deployment.FuneralRequest.Status =
                    "Approved";
            }
            else
            {
                deployment.FuneralRequest.Status =
                    "Staff Deployed";
            }

            deployment.FuneralRequest.UpdatedDate =
                DateTime.Now;

            _context.SaveChanges();
        }
    }
}