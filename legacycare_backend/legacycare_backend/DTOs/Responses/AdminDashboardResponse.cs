namespace PolicyManagement.DTOs.Responses
{
    public class AdminDashboardResponse
    {
        // =========================
        // CLIENTS
        // =========================

        public int TotalClients { get; set; }
        public int ActiveClients { get; set; }
        public int InactiveClients { get; set; }


        // =========================
        // STAFF
        // =========================

        public int TotalStaff { get; set; }
        public int ActiveStaff { get; set; }
        public int InactiveStaff { get; set; }


        // =========================
        // BRANCHES
        // =========================

        public int TotalBranches { get; set; }
        public int ActiveBranches { get; set; }
        public int InactiveBranches { get; set; }


        // =========================
        // REVENUE
        // =========================

        public decimal TotalRevenue { get; set; }

        public decimal TotalLoss { get; set; }


        // =========================
        // REVENUE CHART
        // =========================

        public List<RevenueData> Revenue { get; set; } = new();


        // =========================
        // POLICIES
        // =========================

        public PolicyStatusData PolicyStatus { get; set; } = new();


        // =========================
        // STAFF BY ROLE
        // =========================

        public List<StaffRoleData> StaffByRole { get; set; } = new();


        // =========================
        // TASKS
        // =========================


        public int TotalEvents { get; set; }

        public int TotalTasks { get; set; }
        public List<TaskStatusData> TaskStatus { get; set; } = new();


        // =========================
        // MORTUARY
        // =========================

        public MortuaryData Mortuary { get; set; } = new();


        // =========================
        // RECENT ACTIVITY
        // =========================

        public List<RecentActivityData> RecentActivity { get; set; } = new();
    }


    public class RevenueData
    {
        public string Month { get; set; } = "";

        public decimal Amount { get; set; }
    }


    public class PolicyStatusData
    {
        public int TotalPolicies { get; set; }

        public int ActivePolicies { get; set; }

        public int InactivePolicies { get; set; }

        public int Pending { get; set; }

        public int Expired { get; set; }

        public int Cancelled { get; set; }
    }


    public class StaffRoleData
    {
        public string Role { get; set; } = "";

        public int Count { get; set; }
    }


    public class TaskStatusData
    {
        public string Status { get; set; } = "";

        public int Count { get; set; }
    }


    public class MortuaryData
    {
        public int TotalStorage { get; set; }

        public int Occupied { get; set; }

        public int Available { get; set; }
    }


    public class RecentActivityData
    {
        public string Activity { get; set; } = "";

        public string Date { get; set; } = "";
    }
}