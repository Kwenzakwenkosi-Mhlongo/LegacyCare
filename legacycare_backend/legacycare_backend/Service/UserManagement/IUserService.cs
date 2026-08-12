using PolicyManagement.DTOs.Responses;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public interface IUserService
    {
        IEnumerable<User> GetAllUsers();
        User? GetUserById(string id);
        Task<User?> GetUserByEmail(string email);
        User CreateUser(User user);
        User? UpdateUser(string id, User user);
        User CreateUserWithoutPassword(User user);
        bool DeleteUser(string id);
        User Login(string email, string password);
        UserResponse GetProfile(string userId);
        bool ChangePassword(string id, string currentPassword, string newPassword);
        bool ActivateUser(string id);
        bool DeactivateUser(string id);
        bool EmailExists(string email);
        bool IdNumberExists(string idNumber);
        bool CellNoExists(string cellNo);
        bool EmailExists(string email, string excludeUserId);
        bool IdNumberExists(string idNumber, string excludeUserId);
        bool CellNoExists(string cellNo, string excludeUserId);
    }
}