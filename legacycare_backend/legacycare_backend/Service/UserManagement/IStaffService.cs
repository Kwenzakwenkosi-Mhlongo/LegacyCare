using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public interface IStaffService
    {
        IEnumerable<Staff> GetAllStaff();

        Staff GetStaffById(string staffId);

        IEnumerable<Staff> GetStaffByRole(string role);

        Staff CreateStaff(Staff staff);
        
        bool UpdateStaff(string staffId, UpdateStaffRequest request);

        void DeleteStaff(string staffId);

        void ActivateStaff(string staffId);

    }
}