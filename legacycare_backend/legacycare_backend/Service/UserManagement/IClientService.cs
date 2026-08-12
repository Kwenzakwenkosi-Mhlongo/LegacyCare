using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public interface IClientService
    {
        // Admin functions
        IEnumerable<Client> GetAllClients();

        Client GetClientById(string clientId);

        Client CreateClient(Client client);

        bool UpdateClient(string clientId, UpdateClientRequest request);

        void DeleteClient(string clientId);

        void ActivateClient(string clientId);

        // Logged-in client
        Client GetClientByUserId(string userId);
    }
}