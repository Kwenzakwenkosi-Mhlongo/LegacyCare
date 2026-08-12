using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IDeceasedStorageService
    {
        IEnumerable<DeceasedStorage> GetAllAssignments();
        DeceasedStorage GetAssignmentById(string assignmentId);
        IEnumerable<DeceasedStorage> GetAssignmentsByDeceased(string deceasedId);
        IEnumerable<DeceasedStorage> GetAssignmentsByStorage(string storageId);
        DeceasedStorage AssignStorage(DeceasedStorage assignment);
        void ReleaseStorage(string assignmentId);
    }
}