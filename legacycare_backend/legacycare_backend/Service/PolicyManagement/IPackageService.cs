using PolicyManagement.Models;

namespace PolicyManagement.Service.PackageManagement
{
    public interface IPackageService
    {
        IEnumerable<Package> GetAllPackages();
        Package GetPackageById(string packageId);
        Package CreatePackage(Package package);
        Package UpdatePackage(string packageId, Package package);
        void DeletePackage(string packageId);
    }
}