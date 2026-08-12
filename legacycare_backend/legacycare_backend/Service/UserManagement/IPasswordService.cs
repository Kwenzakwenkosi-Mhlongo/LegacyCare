using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public interface IPasswordService
    {
        string HashPassword(User user, string password);

        bool VerifyPassword(User user,string hashedPassword,string password);
    }
}