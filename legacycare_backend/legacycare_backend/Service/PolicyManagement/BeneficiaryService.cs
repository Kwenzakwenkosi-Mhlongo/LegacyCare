using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class BeneficiaryService : IBeneficiaryService
    {
        private readonly AppDbContext _context;

        public BeneficiaryService(AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Beneficiary> GetAllBeneficiaries()
        {
            return _context.Beneficiary.Include(b => b.Policy).ToList();
        }

        public Beneficiary GetBeneficiaryById(string beneficiaryId)
        {
            var beneficiary = _context.Beneficiary
                .Include(b => b.Policy)
                .FirstOrDefault(b => b.BeneficiaryId == beneficiaryId);

            if (beneficiary == null)
                throw new KeyNotFoundException("Beneficiary not found.");

            return beneficiary;
        }

        public IEnumerable<Beneficiary> GetBeneficiariesByPolicy(string policyId)
        {
            return _context.Beneficiary
                .Where(b => b.PolicyId == policyId)
                .ToList();
        }

        public Beneficiary CreateBeneficiary(Beneficiary beneficiary)
        {
            var policyExists = _context.Policy
                .Any(p => p.PolicyId == beneficiary.PolicyId);

            if (!policyExists)
                throw new KeyNotFoundException("Policy not found.");

            _context.Beneficiary.Add(beneficiary);

            _context.SaveChanges();

            return beneficiary;
        }

        public Beneficiary UpdateBeneficiary(string beneficiaryId, Beneficiary updatedBeneficiary)
        {
            var beneficiary = GetBeneficiaryById(beneficiaryId);

            beneficiary.UpdateDetails(
                updatedBeneficiary.FullName,
                updatedBeneficiary.Relationship);

            _context.SaveChanges();

            return beneficiary;
        }

        public void MarkAsDeceased(string beneficiaryId)
        {
            var beneficiary = GetBeneficiaryById(beneficiaryId);

            beneficiary.MarkAsDeceased();

            _context.SaveChanges();
        }

        public void RemoveBeneficiary(string beneficiaryId)
        {
            var beneficiary = GetBeneficiaryById(beneficiaryId);

            beneficiary.Remove();

            _context.SaveChanges();
        }

        public void ReinstateBeneficiary(string beneficiaryId)
        {
            var beneficiary = GetBeneficiaryById(beneficiaryId);

            beneficiary.Reinstate();

            _context.SaveChanges();
        }

        public void DeleteBeneficiary(string beneficiaryId)
        {
            var beneficiary = GetBeneficiaryById(beneficiaryId);

            _context.Beneficiary.Remove(beneficiary);

            _context.SaveChanges();
        }
    }
}