// File: Service/DashboardManagement/DashboardService.cs

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Responses;

namespace PolicyManagement.Service.DashboardManagement
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public AdminDashboardResponse GetDashboardData()
        {
            var totalClients = _context.Client.Count();

            var activeClients = _context.Client
                .Count(c => c.User.IsActive);

            var inactiveClients = _context.Client
                .Count(c => !c.User.IsActive);

            var totalStaff = _context.Staff.Count();

            var activeStaff = _context.Staff
                .Count(s => s.User.IsActive);

            var inactiveStaff = _context.Staff
                .Count(s => !s.User.IsActive);

            var totalBranches = _context.Branch.Count();

            var activeBranches = _context.Branch
                .Count(b => b.IsActive);

            var inactiveBranches = _context.Branch
                .Count(b => !b.IsActive);

            var totalPolicies = _context.Policy.Count();

            var activePolicies = _context.Policy
                .Count(p => p.Status.ToString() == "Active");

            var pendingPolicies = _context.Policy
                .Count(p => p.Status.ToString() == "Pending");

            var expiredPolicies = _context.Policy
                .Count(p => p.Status.ToString() == "Expired");

            var cancelledPolicies = _context.Policy
                .Count(p => p.Status.ToString() == "Cancelled");

            var inactivePolicies =
                expiredPolicies + cancelledPolicies;

            var successfulPayments = _context.Payment
                .Where(p =>
                    p.Status.ToString() == "SUCCESSFUL" &&
                    p.PaymentDate.HasValue);

            var totalRevenue = successfulPayments
                .Sum(p => (decimal?)p.Amount) ?? 0m;

            decimal totalLoss = 0m;

            var revenue = successfulPayments
                .AsEnumerable()
                .GroupBy(p => new
                {
                    Year = p.PaymentDate!.Value.Year,
                    Month = p.PaymentDate.Value.Month
                })
                .OrderBy(g => g.Key.Year)
                .ThenBy(g => g.Key.Month)
                .Select(g => new RevenueData
                {
                    Month = new DateTime(
                        g.Key.Year,
                        g.Key.Month,
                        1
                    ).ToString("MMM yyyy"),

                    Amount = g.Sum(p => p.Amount)
                })
                .ToList();

            var policyStatus = new PolicyStatusData
            {
                TotalPolicies = totalPolicies,
                ActivePolicies = activePolicies,
                InactivePolicies = inactivePolicies,
                Pending = pendingPolicies,
                Expired = expiredPolicies,
                Cancelled = cancelledPolicies
            };

            var staffByRole = _context.Staff
                .AsEnumerable()
                .GroupBy(s => s.StaffRole.ToString())
                .OrderByDescending(g => g.Count())
                .Select(g => new StaffRoleData
                {
                    Role = g.Key,
                    Count = g.Count()
                })
                .ToList();

            var taskStatus = _context.Task
                .AsEnumerable()
                .GroupBy(t => t.Status.ToString())
                .OrderByDescending(g => g.Count())
                .Select(g => new TaskStatusData
                {
                    Status = g.Key,
                    Count = g.Count()
                })
                .ToList();

            var totalStorage = _context.StorageUnit.Count();

            var availableStorage = _context.StorageUnit
                .Count(s => s.IsAvailable);

            var occupiedStorage = _context.StorageUnit
                .Count(s => !s.IsAvailable);

            var mortuary = new MortuaryData
            {
                TotalStorage = totalStorage,
                Occupied = occupiedStorage,
                Available = availableStorage
            };

            var recentPolicies = _context.Policy
                .AsEnumerable()
                .OrderByDescending(p => p.StartDate)
                .Take(5)
                .Select(p => new RecentActivityData
                {
                    Activity = "Policy created",
                    Date = p.StartDate.ToString("yyyy-MM-dd HH:mm")
                })
                .ToList();

            var recentPayments = _context.Payment
                .Where(p =>
                    p.Status.ToString() == "SUCCESSFUL" &&
                    p.PaymentDate.HasValue)
                .AsEnumerable()
                .OrderByDescending(p => p.PaymentDate)
                .Take(5)
                .Select(p => new RecentActivityData
                {
                    Activity = "Payment received",
                    Date = p.PaymentDate!.Value.ToString(
                        "yyyy-MM-dd HH:mm")
                })
                .ToList();

            var recentTasks = _context.Task
                .AsEnumerable()
                .OrderByDescending(t => t.CreatedDate)
                .Take(5)
                .Select(t => new RecentActivityData
                {
                    Activity = "Task created",
                    Date = t.CreatedDate.ToString("yyyy-MM-dd HH:mm")
                })
                .ToList();

            var recentActivity = recentPolicies
                .Concat(recentPayments)
                .Concat(recentTasks)
                .OrderByDescending(x => x.Date)
                .Take(10)
                .ToList();

            return new AdminDashboardResponse
            {
                TotalClients = totalClients,
                ActiveClients = activeClients,
                InactiveClients = inactiveClients,

                TotalStaff = totalStaff,
                ActiveStaff = activeStaff,
                InactiveStaff = inactiveStaff,

                TotalBranches = totalBranches,
                ActiveBranches = activeBranches,
                InactiveBranches = inactiveBranches,

                TotalRevenue = totalRevenue,
                TotalLoss = totalLoss,

                Revenue = revenue,
                PolicyStatus = policyStatus,
                StaffByRole = staffByRole,
                TaskStatus = taskStatus,

                Mortuary = mortuary,

                RecentActivity = recentActivity
            };
        }

        public DashboardStatsResponse GetDashboardStats()
        {
            return new DashboardStatsResponse
            {
                TotalClients = _context.Client.Count(),
                TotalStaff = _context.Staff.Count(),
                TotalEvents = _context.Event.Count(),
                TotalTasks = _context.Task.Count(),
                TotalPolicies = _context.Policy.Count(),
                TotalPayments = _context.Payment.Count()
            };
        }

        public int GetTotalClients()
        {
            return _context.Client.Count();
        }
    }
}