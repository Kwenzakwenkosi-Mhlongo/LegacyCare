using PolicyManagement.Data;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PackageManagement
{
    public class PackageService : IPackageService
    {
        private readonly AppDbContext _context;

        public PackageService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Package> GetAllPackages()
        {
            return _context.Package.ToList();
        }

        public Package GetPackageById(string packageId)
        {
            var package = _context.Package.FirstOrDefault(p => p.PackageId == packageId);

            if (package == null)
                throw new KeyNotFoundException("Package not found.");

            return package;
        }

        public Package CreatePackage(Package package)
        {
            bool exists = _context.Package.Any(p =>
                p.Name.ToLower() == package.Name.ToLower());

            if (exists)
                throw new InvalidOperationException(
                    "A package with the same name already exists.");

            _context.Package.Add(package);

            _context.SaveChanges();

            return package;
        }

        public Package UpdatePackage(string packageId, Package updatedPackage)
        {
            var package = GetPackageById(packageId);

            package.UpdatePackage(
                updatedPackage.Name,
                updatedPackage.MonthlyPremium,
                updatedPackage.Description);

            _context.SaveChanges();

            return package;
        }


        public void DeletePackage(string packageId)
        {
            var package = GetPackageById(packageId);

            _context.Package.Remove(package);

            _context.SaveChanges();
        }
    }
}