using PolicyManagement.Data;
using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class DeceasedService : IDeceasedService
    {
        private readonly AppDbContext _context;

        public DeceasedService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Deceased> GetAllDeceased()
        {
            return _context.Deceased.ToList();
        }

        public Deceased GetDeceasedById(string deceasedId)
        {
            var deceased = _context.Deceased
                .FirstOrDefault(d => d.DeceasedId == deceasedId);

            if (deceased == null)
                throw new KeyNotFoundException(
                    "Deceased record not found.");

            return deceased;
        }

        public IEnumerable<Deceased> SearchDeceased(string keyword)
        {
            keyword = keyword.ToLower();

            return _context.Deceased
                .Where(d =>
                    d.FullName.ToLower().Contains(keyword) ||
                    d.IDNumber.Contains(keyword))
                .ToList();
        }

        public Deceased RegisterDeceased(Deceased deceased)
        {
            bool policyExists = _context.Policy
                .Any(p => p.PolicyId == deceased.PolicyId);

            if (!policyExists)
                throw new InvalidOperationException(
                    "Policy not found.");

            _context.Deceased.Add(deceased);

            _context.SaveChanges();

            return deceased;
        }

        public Deceased UpdateDeceased(string deceasedId, Deceased deceased)
        {
            var existing = GetDeceasedById(deceasedId);

            existing.FullName = deceased.FullName;
            existing.Gender = deceased.Gender;
            existing.CauseOfDeath = deceased.CauseOfDeath;

            _context.SaveChanges();

            return GetDeceasedById(deceasedId);
        }

        public void ReleaseDeceased(string deceasedId)
        {
            var deceased = GetDeceasedById(deceasedId);

            deceased.Release();

            _context.SaveChanges();
        }

        public void DeleteDeceased(string deceasedId)
        {
            var deceased = GetDeceasedById(deceasedId);

            _context.Deceased.Remove(deceased);

            _context.SaveChanges();
        }
    }
}