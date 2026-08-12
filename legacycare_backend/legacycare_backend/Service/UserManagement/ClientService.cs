using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public class ClientService : IClientService
    {
        private readonly AppDbContext _context;

        public ClientService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Client> GetAllClients()
        {
            return _context.Client
                .Include(c => c.User)
                .AsEnumerable()
                .OrderBy(c => int.TryParse(c.ClientId, out int id) ? id : 0)
                .ToList();
        }

        public Client GetClientById(string clientId)
        {
            var client = _context.Client
                .Include(c => c.User)
                .FirstOrDefault(c => c.ClientId == clientId);

            if (client == null)
                throw new KeyNotFoundException("Client not found.");

            return client;
        }

        public Client CreateClient(Client client)
        {
            client.ClientId = GenerateClientId();

            _context.Client.Add(client);
            _context.SaveChanges();

            return client;
        }

        public bool UpdateClient(string clientId, UpdateClientRequest request)
        {
            var client = GetClientById(clientId);

            client.User.FullName = request.FullName;
            client.User.IDNumber = request.IdNumber;
            client.User.Email = request.Email;
            client.User.CellNo = request.CellNo;
            client.User.Address = request.Address;
            client.User.IsActive = request.IsActive;

            _context.SaveChanges();

            return true;
        }

        // Permanently delete the Client and User
        public void DeleteClient(string clientId)
        {
            var client = GetClientById(clientId);

            if (client == null)
                throw new KeyNotFoundException("Client not found.");

            var user = client.User;

            // Delete password setup tokens belonging to the user
            var passwordTokens = _context.PasswordSetupTokens
                .Where(t => t.UserId == user.UserId)
                .ToList();

            if (passwordTokens.Any())
            {
                _context.PasswordSetupTokens.RemoveRange(passwordTokens);
            }

            // Delete the Client record
            _context.Client.Remove(client);

            // Delete the User record
            _context.Users.Remove(user);

            // Save all deletions
            _context.SaveChanges();
        }

        public void ActivateClient(string clientId)
        {
            var client = GetClientById(clientId);

            client.User.ActivateAccount();

            _context.SaveChanges();
        }

        private string GenerateClientId()
        {
            var maxId = _context.Client
                .AsEnumerable()
                .Select(c => int.TryParse(c.ClientId, out int id) ? id : 0)
                .DefaultIfEmpty(0)
                .Max();

            return (maxId + 1).ToString();
        }
    }
}