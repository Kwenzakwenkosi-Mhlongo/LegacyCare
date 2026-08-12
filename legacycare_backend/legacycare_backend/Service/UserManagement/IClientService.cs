using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public interface IClientService
    {
        IEnumerable<Client> GetAllClients();

        Client GetClientById(string clientId);

        Client GetClientByUserId(string userId);

        Client CreateClient(Client client);

        bool UpdateClient(
            string clientId,
            UpdateClientRequest request
        );

        void DeleteClient(string clientId);

        void ActivateClient(string clientId);
    }
}