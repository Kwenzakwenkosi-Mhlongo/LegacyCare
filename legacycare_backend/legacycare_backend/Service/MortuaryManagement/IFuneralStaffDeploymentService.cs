// Service/MortuaryManagement/IFuneralStaffDeploymentService.cs

using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IFuneralStaffDeploymentService
    {
        IEnumerable<FuneralStaffDeployment>
            GetByFuneralRequest(
                string funeralRequestId);

        IEnumerable<object>
            GetAvailableStaff(
                string funeralRequestId,
                int requiredStaff);

        IEnumerable<FuneralStaffDeployment>
            DeployStaff(
                string deployedByUserId,
                string funeralRequestId,
                DeployFuneralStaffRequest request);

        void RemoveDeployment(
            string deployedByUserId,
            int deploymentId);
    }
}