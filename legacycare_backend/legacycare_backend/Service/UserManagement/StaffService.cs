using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public class StaffService : IStaffService
    {
        private readonly AppDbContext _context;

        public StaffService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Staff> GetAllStaff()
{
    try
    {
        return _context.Staff
            .Include(s => s.User)
            .Include(s => s.Branch)
            .AsEnumerable()
            .OrderBy(s => int.TryParse(s.StaffId, out int id) ? id : 0)
            .ToList();
    }
    catch (Exception ex)
    {
        Console.WriteLine("========== STAFF ERROR ==========");
        Console.WriteLine(ex.ToString());
        Console.WriteLine("=================================");
        throw;
    }
}

        public Staff GetStaffById(string staffId)
        {
            var staff = _context.Staff
                .Include(s => s.User)
                .Include(s => s.Branch)
                .FirstOrDefault(s => s.StaffId == staffId);

            if (staff == null)
                throw new KeyNotFoundException("Staff member not found.");

            return staff;
        }

        public IEnumerable<Staff> GetStaffByRole(string role)
        {
            if (!Enum.TryParse<StaffType>(role, true, out var staffRole))
            throw new ArgumentException("Invalid Staff Role");
            return _context.Staff
                .Include(s => s.User)
                .Include(s => s.Branch)
                .Where(s => s.StaffRole == staffRole)
                .ToList();
        }

        public Staff CreateStaff(Staff staff)
        {
            staff.StaffId = GenerateStaffId();
            staff.Salary = GetSalaryForRole(staff.StaffRole);

            _context.Staff.Add(staff);
            _context.SaveChanges();

            return staff;
        }

        public bool UpdateStaff(string staffId, UpdateStaffRequest request)
        {
            var staff = GetStaffById(staffId);

            staff.User.FullName = request.FullName;
            staff.User.IDNumber = request.IdNumber;
            staff.User.Email = request.Email;
            staff.User.CellNo = request.CellNo;
            staff.User.Address = request.Address;
            staff.StaffRole = request.StaffRole;
            staff.BranchId = request.BranchId;

            _context.SaveChanges();

            return true;
        }

        public void DeleteStaff(string staffId)
        {
            var staff = GetStaffById(staffId);

            staff.User.DeactivateAccount();
            _context.SaveChanges();
        }

        public void ActivateStaff(string staffId)
        {
            var client = GetStaffById(staffId);

            client.User.ActivateAccount();
            _context.SaveChanges();
        }

        private string GenerateStaffId()
        {
            var maxId = _context.Staff
            .AsEnumerable()
                .Select(s => int.TryParse(s.StaffId, out int id) ? id : 0)
                .DefaultIfEmpty(0).Max();
            return (maxId + 1).ToString();

            
        }

        private decimal GetSalaryForRole(StaffType role)
        {
            return role switch
            {
                StaffType.Admin => 35000m,
                StaffType.Clerk => 18000m,
                StaffType.Driver => 15500m,
                StaffType.GraveDigger => 14500m,
                StaffType.MortuaryAttendant => 17000m,
                StaffType.OnSiteStaff => 16500m,
                _ => 0m
            };
        }
    }
}