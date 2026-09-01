// ============================================================================
// File: Service/PolicyManagement/BeneficiaryService.cs
// ============================================================================

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Enums;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class BeneficiaryService : IBeneficiaryService
    {
        private readonly AppDbContext _context;

        public BeneficiaryService(
            AppDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Beneficiary> GetAllBeneficiaries()
        {
            return _context.Beneficiary
                .AsNoTracking()
                .Include(beneficiary => beneficiary.Policy)
                .OrderBy(beneficiary => beneficiary.FullName)
                .ToList();
        }

        public Beneficiary GetBeneficiaryById(
            string beneficiaryId)
        {
            if (string.IsNullOrWhiteSpace(beneficiaryId))
            {
                throw new ArgumentException(
                    "Beneficiary ID is required.",
                    nameof(beneficiaryId));
            }

            var beneficiary =
                _context.Beneficiary
                    .Include(item => item.Policy)
                    .FirstOrDefault(item =>
                        item.BeneficiaryId == beneficiaryId);

            if (beneficiary == null)
            {
                throw new KeyNotFoundException(
                    "Beneficiary not found.");
            }

            return beneficiary;
        }

        /// <summary>
        /// Returns active beneficiaries only.
        /// Only Alive beneficiaries consume package slots.
        /// </summary>
        public IEnumerable<Beneficiary> GetBeneficiariesByPolicy(
            string policyId)
        {
            ValidatePolicyId(policyId);

            return _context.Beneficiary
                .AsNoTracking()
                .Include(beneficiary => beneficiary.Policy)
                .Where(beneficiary =>
                    beneficiary.PolicyId == policyId &&
                    beneficiary.Status == BeneficiaryStatus.Alive)
                .OrderBy(beneficiary => beneficiary.FullName)
                .ToList();
        }

        /// <summary>
        /// Returns removed and deceased beneficiaries for policy history.
        /// These beneficiaries do not consume package slots.
        /// </summary>
        public IEnumerable<Beneficiary> GetPastBeneficiariesByPolicy(
            string policyId)
        {
            ValidatePolicyId(policyId);

            return _context.Beneficiary
                .AsNoTracking()
                .Include(beneficiary => beneficiary.Policy)
                .Where(beneficiary =>
                    beneficiary.PolicyId == policyId &&
                    (
                        beneficiary.Status == BeneficiaryStatus.Removed ||
                        beneficiary.Status == BeneficiaryStatus.Deceased
                    ))
                .OrderBy(beneficiary => beneficiary.FullName)
                .ToList();
        }

        public Beneficiary CreateBeneficiary(
            Beneficiary beneficiary)
        {
            ArgumentNullException.ThrowIfNull(
                beneficiary);

            if (string.IsNullOrWhiteSpace(
                beneficiary.PolicyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(beneficiary));
            }

            var policyExists =
                _context.Policy.Any(policy =>
                    policy.PolicyId ==
                    beneficiary.PolicyId);

            if (!policyExists)
            {
                throw new KeyNotFoundException(
                    "Policy not found.");
            }

            beneficiary.Status =
                BeneficiaryStatus.Alive;

            _context.Beneficiary.Add(
                beneficiary);

            _context.SaveChanges();

            return beneficiary;
        }

        public Beneficiary UpdateBeneficiary(
            string beneficiaryId,
            Beneficiary updatedBeneficiary)
        {
            ArgumentNullException.ThrowIfNull(
                updatedBeneficiary);

            var beneficiary =
                GetBeneficiaryById(
                    beneficiaryId);

            if (beneficiary.Status !=
                BeneficiaryStatus.Alive)
            {
                throw new InvalidOperationException(
                    "Only active beneficiaries can be updated.");
            }

            beneficiary.UpdateDetails(
                updatedBeneficiary.FullName,
                updatedBeneficiary.DateOfBirth,
                updatedBeneficiary.Gender,
                updatedBeneficiary.Relationship);

            beneficiary.IDNumber =
                updatedBeneficiary.IDNumber;

            _context.SaveChanges();

            return beneficiary;
        }

        public void MarkAsDeceased(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(
                    beneficiaryId);

            if (beneficiary.Status ==
                BeneficiaryStatus.Deceased)
            {
                throw new InvalidOperationException(
                    "Beneficiary is already marked as deceased.");
            }

            beneficiary.MarkAsDeceased();

            _context.SaveChanges();
        }

        public void RemoveBeneficiary(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(
                    beneficiaryId);

            if (beneficiary.Status !=
                BeneficiaryStatus.Alive)
            {
                throw new InvalidOperationException(
                    "Only active beneficiaries can be removed.");
            }

            beneficiary.Remove();

            _context.SaveChanges();
        }

        public void ReinstateBeneficiary(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(
                    beneficiaryId);

            if (beneficiary.Status ==
                BeneficiaryStatus.Alive)
            {
                throw new InvalidOperationException(
                    "Beneficiary is already active.");
            }

            if (beneficiary.Status ==
                BeneficiaryStatus.Deceased)
            {
                throw new InvalidOperationException(
                    "A deceased beneficiary cannot be reinstated.");
            }

            beneficiary.Reinstate();

            _context.SaveChanges();
        }

        public void DeleteBeneficiary(
            string beneficiaryId)
        {
            var beneficiary =
                GetBeneficiaryById(
                    beneficiaryId);

            _context.Beneficiary.Remove(
                beneficiary);

            _context.SaveChanges();
        }

        private static void ValidatePolicyId(
            string policyId)
        {
            if (string.IsNullOrWhiteSpace(policyId))
            {
                throw new ArgumentException(
                    "Policy ID is required.",
                    nameof(policyId));
            }
        }
    }
}