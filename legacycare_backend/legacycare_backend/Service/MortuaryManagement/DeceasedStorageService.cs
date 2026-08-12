using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class DeceasedStorageService : IDeceasedStorageService
    {
        private readonly AppDbContext _context;

        public DeceasedStorageService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<DeceasedStorage> GetAllAssignments()
        {
            return _context.DeceasedStorage
                .Include(ds => ds.Storage)
                .Include(ds => ds.Deceased)
                .ToList();
        }

        public DeceasedStorage GetAssignmentById(string assignmentId)
        {
            var assignment = _context.DeceasedStorage
                .Include(ds => ds.Storage)
                .Include(ds => ds.Deceased)
                .FirstOrDefault(ds => ds.AssignmentId == assignmentId);

            if (assignment == null)
                throw new KeyNotFoundException($"Assignment with ID {assignmentId} not found.");

            return assignment;
        }

        public IEnumerable<DeceasedStorage> GetAssignmentsByDeceased(string deceasedId)
        {
            return _context.DeceasedStorage
                .Include(ds => ds.Storage)
                .Where(ds => ds.DeceasedId == deceasedId)
                .ToList();
        }

        public IEnumerable<DeceasedStorage> GetAssignmentsByStorage(string storageId)
        {
            return _context.DeceasedStorage
                .Include(ds => ds.Deceased)
                .Where(ds => ds.StorageId == storageId)
                .ToList();
        }

        public DeceasedStorage AssignStorage(DeceasedStorage assignment)
        {
            var storage = _context.StorageUnit.Find(assignment.StorageId);
            if (storage == null)
                throw new KeyNotFoundException($"Storage with ID {assignment.StorageId} not found.");

            if (!storage.IsAvailable)
                throw new InvalidOperationException("Storage unit is not available.");

            var existingAssignment = _context.DeceasedStorage
                .FirstOrDefault(ds => ds.DeceasedId == assignment.DeceasedId && ds.DateRemoved == null);

            if (existingAssignment != null)
                throw new InvalidOperationException("Deceased already has an active storage assignment.");

            assignment.AssignmentId = Guid.NewGuid().ToString();
            assignment.DateAssigned = DateTime.UtcNow;
            assignment.DateRemoved = null;

            storage.MarkUnavailable();

            _context.DeceasedStorage.Add(assignment);
            _context.SaveChanges();

            return GetAssignmentById(assignment.AssignmentId);
        }

        public void ReleaseStorage(string assignmentId)
        {
            var assignment = GetAssignmentById(assignmentId);

            if (assignment.DateRemoved.HasValue)
                throw new InvalidOperationException("This storage assignment has already been released.");

            assignment.DateRemoved = DateTime.UtcNow;

            var storage = _context.StorageUnit.Find(assignment.StorageId);
            if (storage != null)
            {
                storage.MarkAvailable();
            }

            _context.SaveChanges();
        }
    }
}