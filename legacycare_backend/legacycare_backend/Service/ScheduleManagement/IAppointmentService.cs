// File: Service/ScheduleManagement/IAppointmentService.cs

using PolicyManagement.DTOs.Requests;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.ScheduleManagement
{
    public interface IAppointmentService
    {
        Appointment Create(
            string clientId,
            CreateAppointmentRequest request);

        IEnumerable<Appointment> GetByClient(
            string clientId);

        Appointment? GetById(
            int appointmentId);

        Appointment UpdateForClient(
            int appointmentId,
            string clientId,
            UpdateAppointmentRequest request);

        IEnumerable<Appointment> GetForClerk(
            string? branchId = null,
            string? status = null);

        IEnumerable<Staff> GetAvailableStaff(
            int appointmentId,
            DateTime? appointmentDateTime = null);

        Appointment Review(
            int appointmentId,
            ReviewAppointmentRequest request);
    }
}