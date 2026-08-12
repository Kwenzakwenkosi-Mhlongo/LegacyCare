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

        // =========================================================
        // ADMIN - GET ALL CLIENTS
        // =========================================================

        public IEnumerable<Client> GetAllClients()
        {
            return _context.Client
                .Include(c => c.User)
                .AsEnumerable()
                .OrderBy(c =>
                    int.TryParse(c.ClientId, out int id) ? id : 0)
                .ToList();
        }


        // =========================================================
        // ADMIN - GET CLIENT BY CLIENT ID
        // =========================================================

        public Client GetClientById(string clientId)
        {
            var client = _context.Client
                .Include(c => c.User)
                .FirstOrDefault(c => c.ClientId == clientId);

            if (client == null)
            {
                throw new KeyNotFoundException(
                    "Client not found."
                );
            }

            return client;
        }


        // =========================================================
        // CLIENT - GET LOGGED-IN CLIENT
        // =========================================================

        public Client GetClientByUserId(string userId)
        {
            var client = _context.Client
                .Include(c => c.User)
                .FirstOrDefault(c => c.UserId == userId);

            if (client == null)
            {
                throw new KeyNotFoundException(
                    "Client account not found."
                );
            }

            return client;
        }


        // =========================================================
        // CREATE CLIENT
        // =========================================================

        public Client CreateClient(Client client)
        {
            client.ClientId = GenerateClientId();

            _context.Client.Add(client);

            _context.SaveChanges();

            return client;
        }


        // =========================================================
        // UPDATE CLIENT
        // =========================================================

        public bool UpdateClient(
            string clientId,
            UpdateClientRequest request)
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


        // =========================================================
        // DELETE CLIENT
        // =========================================================

        public void DeleteClient(string clientId)
        {
            var client = GetClientById(clientId);

            var user = client.User;

            // Delete password setup tokens
            var passwordTokens = _context.PasswordSetupTokens
                .Where(t => t.UserId == user.UserId)
                .ToList();

            if (passwordTokens.Any())
            {
                _context.PasswordSetupTokens
                    .RemoveRange(passwordTokens);
            }

            // Delete client
            _context.Client.Remove(client);

            // Delete user
            _context.Users.Remove(user);

            _context.SaveChanges();
        }


        // =========================================================
        // ACTIVATE CLIENT
        // =========================================================

        public void ActivateClient(string clientId)
        {
            var client = GetClientById(clientId);

            client.User.ActivateAccount();

            _context.SaveChanges();
        }


        // =========================================================
        // GENERATE CLIENT ID
        // =========================================================

        private string GenerateClientId()
        {
            var maxId = _context.Client
                .AsEnumerable()
                .Select(c =>
                    int.TryParse(c.ClientId, out int id)
                        ? id
                        : 0)
                .DefaultIfEmpty(0)
                .Max();

            return (maxId + 1).ToString();
        }
    }
}