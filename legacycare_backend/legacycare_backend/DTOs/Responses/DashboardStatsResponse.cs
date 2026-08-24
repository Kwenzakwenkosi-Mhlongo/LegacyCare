namespace PolicyManagement.DTOs.Responses
{
    public class DashboardStatsResponse
    {
        public int TotalClients { get; set; }

        public int TotalStaff { get; set; }

        public int TotalEvents { get; set; }

        public int TotalTasks { get; set; }

        public int TotalPolicies { get; set; }

        public int TotalPayments { get; set; }
    }
}