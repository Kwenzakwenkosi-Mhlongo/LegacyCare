using PolicyManagement.Data;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class StorageService : IStorageService
    {
        private readonly AppDbContext _context;

        public StorageService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Storage> GetAllStorageUnits()
        {
            return _context.StorageUnit.ToList();
        }

        public IEnumerable<Storage> GetAvailableStorageUnits()
        {
            return _context.StorageUnit
                .Where(s => s.IsAvailable)
                .ToList();
        }

        public Storage GetStorageById(string storageId)
        {
            var storage = _context.StorageUnit
                .FirstOrDefault(s => s.StorageId == storageId);

            if (storage == null)
                throw new KeyNotFoundException(
                    "Storage unit not found.");

            return storage;
        }

        public Storage CreateStorage(Storage storage)
        {
            bool exists = _context.StorageUnit.Any(s =>
                s.UnitNumber == storage.UnitNumber &&
                s.BranchId == storage.BranchId);

            if (exists)
                throw new InvalidOperationException(
                    "Storage unit already exists.");

            _context.StorageUnit.Add(storage);

            _context.SaveChanges();

            return storage;
        }

        public Storage UpdateStorage(
            string storageId,
            Storage updatedStorage)
        {
            var storage = GetStorageById(storageId);

            storage.UpdateUnitNumber(
                updatedStorage.UnitNumber);

            _context.SaveChanges();

            return storage;
        }

        public void MarkAvailable(string storageId)
        {
            var storage = GetStorageById(storageId);

            storage.MarkAvailable();

            _context.SaveChanges();
        }

        public void MarkUnavailable(string storageId)
        {
            var storage = GetStorageById(storageId);

            storage.MarkUnavailable();

            _context.SaveChanges();
        }

        public void DeleteStorage(string storageId)
        {
            var storage = GetStorageById(storageId);

            _context.StorageUnit.Remove(storage);

            _context.SaveChanges();
        }
    }
}