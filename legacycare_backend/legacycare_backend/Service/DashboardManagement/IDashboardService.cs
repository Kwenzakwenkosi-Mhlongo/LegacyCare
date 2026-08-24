using PolicyManagement.DTOs.Responses;

namespace PolicyManagement.Service.DashboardManagement
{
    public interface IDashboardService
    {
        AdminDashboardResponse GetDashboardData();

        DashboardStatsResponse GetDashboardStats();

        int GetTotalClients();
    }
}