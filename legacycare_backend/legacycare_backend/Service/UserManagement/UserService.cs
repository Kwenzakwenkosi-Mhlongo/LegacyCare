using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Responses;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IPasswordService _passwordService;

        public UserService(AppDbContext context, IPasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

public User CreateUserWithoutPassword(User user)
{
    _context.Users.Add(user);
    _context.SaveChanges();

    return user;
}
        public IEnumerable<User> GetAllUsers()
        {
            return _context.Users.ToList();
        }

        public User? GetUserById(string id)
        {
            return _context.Users.Find(id);
        }

        public async Task<User?> GetUserByEmail(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public User CreateUser(User user)
        {
            user.PasswordHash = _passwordService.HashPassword(user, user.PasswordHash);
            _context.Users.Add(user);
            _context.SaveChanges();
            return user;
        }

        public User? UpdateUser(string id, User updatedUser)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return null;

            user.UpdateDetails(
                updatedUser.FullName,
                updatedUser.Role,
                updatedUser.CellNo,
                updatedUser.Address,
                updatedUser.Email);

            _context.SaveChanges();
            return user;
        }

        public bool DeleteUser(string id)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return false;

            _context.Users.Remove(user);
            _context.SaveChanges();
            return true;
        }

        public User Login(string email, string password)
        {
            var user = _context.Users
                .FirstOrDefault(x => x.Email == email);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            if (!_passwordService.VerifyPassword(user, user.PasswordHash, password))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            user.LastLogin = DateTime.UtcNow;
            _context.SaveChanges();

            return user;
        }

        public UserResponse GetProfile(string userId)
        {
            var user = _context.Users.FirstOrDefault(u => u.UserId == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            return new UserResponse
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                IDNumber = user.IDNumber ?? "Not provided",
                CellNo = user.CellNo ?? "Not provided",
                Address = user.Address ?? "Not provided",
                Role = user.Role,
                IsActive = user.IsActive,
                DateCreated = user.DateCreated,
                LastLogin = user.LastLogin
            };
        }

        public bool ChangePassword(string id, string currentPassword, string newPassword)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return false;

            if (!_passwordService.VerifyPassword(user, user.PasswordHash, currentPassword))
            {
                throw new InvalidOperationException("Current password is incorrect.");
            }

            if (string.IsNullOrWhiteSpace(newPassword))
            {
                throw new ArgumentException("New password cannot be empty.");
            }

            if (newPassword.Length < 8)
            {
                throw new ArgumentException("Password must be at least 8 characters long.");
            }

            string newHash = _passwordService.HashPassword(user, newPassword);
            user.ChangePassword(newHash);
            _context.SaveChanges();

            return true;
        }

        public bool ActivateUser(string id)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return false;

            user.ActivateAccount();
            _context.SaveChanges();
            return true;
        }

        public bool DeactivateUser(string id)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return false;

            user.DeactivateAccount();
            _context.SaveChanges();
            return true;
        }

        public bool EmailExists(string email)
        {
            return _context.Users.Any(u => u.Email.ToLower() == email.ToLower());
        }

        public bool IdNumberExists(string idNumber)
        {
            return _context.Users.Any(u => u.IDNumber == idNumber);
        }

        public bool CellNoExists(string cellNo)
        {
            return _context.Users.Any(u => u.CellNo == cellNo);
        }

        public bool EmailExists(string email, string excludeUserId)
        {
            return _context.Users.Any(u => u.Email.ToLower() == email.ToLower() && u.UserId != excludeUserId);
        }

        public bool IdNumberExists(string idNumber, string excludeUserId)
        {
            return _context.Users.Any(u => u.IDNumber == idNumber && u.UserId != excludeUserId);
        }

        public bool CellNoExists(string cellNo, string excludeUserId)
        {
            return _context.Users.Any(u => u.CellNo == cellNo && u.UserId != excludeUserId);
        }
    }
}