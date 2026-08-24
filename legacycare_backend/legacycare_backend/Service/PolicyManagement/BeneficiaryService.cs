using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Models;
using PolicyManagement.DTOs.Requests;
using PolicyManagement.Enums;

namespace PolicyManagement.Service.PolicyManagement
{
    public class BeneficiaryService : IBeneficiaryService
    {
        private readonly AppDbContext _context;

        public BeneficiaryService(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL BENEFICIARIES
        // =========================================================

        public IEnumerable<Beneficiary> GetAllBeneficiaries()
        {
            return _context.Beneficiary
                .Include(b => b.Policy)
                .ToList();
        }

        // =========================================================
        // GET BENEFICIARY BY ID
        // =========================================================

        public Beneficiary GetBeneficiaryById(string beneficiaryId)
        {
            var beneficiary = _context.Beneficiary
                .Include(b => b.Policy)
                .FirstOrDefault(
                    b => b.BeneficiaryId == beneficiaryId
                );

            if (beneficiary == null)
            {
                throw new KeyNotFoundException(
                    "Beneficiary not found."
                );
            }

            return beneficiary;
        }

        // =========================================================
        // GET BENEFICIARIES BY POLICY
        // =========================================================
        //
        // ONLY ALIVE BENEFICIARIES ARE RETURNED.
        //
        // Alive    -> INCLUDED
        // Removed  -> EXCLUDED
        // Deceased -> EXCLUDED
        //
        // This endpoint is used by the client Report Death page.
        // =========================================================

        public IEnumerable<Beneficiary> GetBeneficiariesByPolicy(
            string policyId)
        {
            return _context.Beneficiary
                .AsNoTracking()
                .Include(b => b.Policy)
                .Where(b =>
                    b.PolicyId == policyId &&
                    b.Status == BeneficiaryStatus.Alive
                )
                .ToList();
        }

        // =========================================================
        // CREATE BENEFICIARY
        // =========================================================

        public Beneficiary CreateBeneficiary(
            Beneficiary beneficiary)
        {
            if (beneficiary == null)
            {
                throw new ArgumentNullException(
                    nameof(beneficiary)
                );
            }

            var policyExists = _context.Policy
                .Any(p =>
                    p.PolicyId == beneficiary.PolicyId
                );

            if (!policyExists)
            {
                throw new KeyNotFoundException(
                    "Policy not found."
                );
            }

            // New beneficiaries are always Alive.
            beneficiary.Status =
                BeneficiaryStatus.Alive;

            _context.Beneficiary.Add(
                beneficiary
            );

            _context.SaveChanges();

            return beneficiary;
        }

        // =========================================================
        // UPDATE BENEFICIARY
        // =========================================================

        public Beneficiary UpdateBeneficiary(
            string beneficiaryId,
            Beneficiary updatedBeneficiary)
        {
            if (updatedBeneficiary == null)
            {
                throw new ArgumentNullException(
                    nameof(updatedBeneficiary)
                );
            }

            var beneficiary =
                GetBeneficiaryById(beneficiaryId);

            beneficiary.UpdateDetails(
                updatedBeneficiary.FullName,
                updatedBeneficiary.DateOfBirth,
                updatedBeneficiary.Gender,
                updatedBeneficiary.Relationship
            );

            beneficiary.IDNumber =
                updatedBeneficiary.IDNumber;

            // IMPORTANT:
            // Do not overwrite Status.
            //
            // If a beneficiary is Deceased or Removed,
            // updating their personal details must not
            // automatically make them Alive again.

            _context.SaveChanges();

            return beneficiary;
        }

        // =========================================================
        // MARK AS DECEASED
        // =========================================================

        public void MarkAsDeceased(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(beneficiaryId);

            beneficiary.MarkAsDeceased();

            _context.SaveChanges();
        }

        // =========================================================
        // REMOVE BENEFICIARY
        // =========================================================

        public void RemoveBeneficiary(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(beneficiaryId);

            beneficiary.Remove();

            _context.SaveChanges();
        }

        // =========================================================
        // REINSTATE BENEFICIARY
        // =========================================================

        public void ReinstateBeneficiary(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(beneficiaryId);

            beneficiary.Reinstate();

            _context.SaveChanges();
        }

        // =========================================================
        // DELETE BENEFICIARY
        // =========================================================

        public void DeleteBeneficiary(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(beneficiaryId);

            _context.Beneficiary.Remove(
                beneficiary
            );

            _context.SaveChanges();
        }
    }
}