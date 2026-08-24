using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IFuneralStaffDeploymentService
    {
        // ============================================================
        // GET STAFF DEPLOYED TO A FUNERAL
        // ============================================================

        IEnumerable<FuneralStaffDeployment> GetByFuneralRequest(
            string funeralRequestId);

        // ============================================================
        // GET AVAILABLE OPERATIONAL STAFF
        // ============================================================

        IEnumerable<object> GetAvailableStaff(
            string funeralRequestId,
            int requiredStaff);

        // ============================================================
        // DEPLOY STAFF
        // ============================================================

        IEnumerable<FuneralStaffDeployment> DeployStaff(
            string deployedByUserId,
            string funeralRequestId,
            DeployFuneralStaffRequest request);

        // ============================================================
        // REMOVE STAFF DEPLOYMENT
        // ============================================================

        void RemoveDeployment(
            string deployedByUserId,
            int deploymentId);
    }
}