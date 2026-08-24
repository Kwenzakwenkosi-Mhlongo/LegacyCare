using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models;

namespace PolicyManagement.Service.ServiceRequestManagement
{
    public interface IServiceRequestService
    {
        IEnumerable<ServiceRequest> GetAll();

        IEnumerable<ServiceRequest> GetByClient(
            string clientId
        );

        ServiceRequest? GetById(
            int id
        );

        ServiceRequest Create(
            string clientId,
            CreateServiceRequestRequest request
        );

        ServiceRequest Update(
            int id,
            string clientId,
            UpdateServiceRequestDto request
        );

        void Delete(
            int id,
            string clientId
        );
    }
}