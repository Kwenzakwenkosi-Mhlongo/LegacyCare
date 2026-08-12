using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IStorageService
    {
        IEnumerable<Storage> GetAllStorageUnits();

        IEnumerable<Storage> GetAvailableStorageUnits();

        Storage GetStorageById(string storageId);

        Storage CreateStorage(Storage storage);

        Storage UpdateStorage(
            string storageId,
            Storage storage);

        void MarkAvailable(string storageId);

        void MarkUnavailable(string storageId);

        void DeleteStorage(string storageId);
    }
}