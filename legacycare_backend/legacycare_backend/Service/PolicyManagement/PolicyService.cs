using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.DTOs.PolicyManagement;
using PolicyManagement.Enums;
using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public class PolicyService : IPolicyService
    {
        private readonly AppDbContext _context;

        public PolicyService(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL POLICIES
        // =========================================================

        public IEnumerable<Policy> GetAllPolicies()
        {
            var policies = _context.Policy
                .Include(p => p.User)
                .Include(p => p.Package)
                .ToList();

            foreach (var policy in policies)
            {
                policy.Beneficiaries = _context.Beneficiary
                    .Where(b => b.PolicyId == policy.PolicyId)
                    .ToList();
            }

            return policies;
        }

        // =========================================================
        // GET POLICY BY ID
        // =========================================================

        public Policy GetPolicyById(string policyId)
        {
            var policy = _context.Policy
                .Include(p => p.User)
                .Include(p => p.Package)
                .FirstOrDefault(p => p.PolicyId == policyId);

            if (policy == null)
            {
                throw new KeyNotFoundException(
                    "Policy not found."
                );
            }

            policy.Beneficiaries = _context.Beneficiary
                .Where(b => b.PolicyId == policyId)
                .ToList();

            return policy;
        }

        // =========================================================
        // GET POLICIES BY USER
        // =========================================================

        public IEnumerable<Policy> GetPoliciesByUser(string userId)
        {
            var policies = _context.Policy
                .Include(p => p.User)
                .Include(p => p.Package)
                .Where(p => p.UserId == userId)
                .ToList();

            foreach (var policy in policies)
            {
                policy.Beneficiaries = _context.Beneficiary
                    .Where(b => b.PolicyId == policy.PolicyId)
                    .ToList();
            }

            return policies;
        }

        // =========================================================
        // CREATE POLICY
        // =========================================================

        public Policy CreatePolicy(Policy policy)
        {
            var user = _context.Users
                .FirstOrDefault(u => u.UserId == policy.UserId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User not found."
                );
            }

            bool isClient = _context.Users
                .Any(u =>
                    u.UserId == policy.UserId &&
                    u.Role == UserRole.Client
                );

            if (!isClient)
            {
                throw new InvalidOperationException(
                    "Policies can only be created for clients."
                );
            }

            var packageExists = _context.Package
                .Any(p => p.PackageId == policy.PackageId);

            if (!packageExists)
            {
                throw new KeyNotFoundException(
                    "Package not found."
                );
            }

            _context.Policy.Add(policy);

            _context.SaveChanges();

            return policy;
        }

        // =========================================================
        // UPDATE POLICY
        // =========================================================

        public Policy UpdatePolicy(
            string policyId,
            Policy updatedPolicy)
        {
            var policy = GetPolicyById(policyId);

            policy.ChangeStartDate(
                updatedPolicy.StartDate
            );

            _context.SaveChanges();

            return policy;
        }

        // =========================================================
        // ACTIVATE
        // =========================================================

        public void ActivatePolicy(string policyId)
        {
            var policy = GetPolicyById(policyId);

            policy.Activate();

            _context.SaveChanges();
        }

        // =========================================================
        // CANCEL
        // =========================================================

        public void CancelPolicy(string policyId)
        {
            var policy = GetPolicyById(policyId);

            policy.Cancel();

            _context.SaveChanges();
        }

        // =========================================================
        // DISCONTINUE
        // =========================================================

        public void DiscontinuePolicy(string policyId)
        {
            var policy = GetPolicyById(policyId);

            policy.Discontinue();

            _context.SaveChanges();
        }

        // =========================================================
        // UPDATE STATUS
        // =========================================================

        public void UpdatePolicyStatus(
            string policyId,
            PolicyStatus status)
        {
            var policy = GetPolicyById(policyId);

            policy.Status = status;

            if (
                status == PolicyStatus.Cancelled ||
                status == PolicyStatus.Discontinued ||
                status == PolicyStatus.Expired ||
                status == PolicyStatus.Lapsed
            )
            {
                policy.EndDate = DateTime.Now;
            }

            _context.SaveChanges();
        }

        // =========================================================
        // CHANGE POLICY PACKAGE
        // =========================================================

        public ChangePolicyResult ChangePolicyPackage(
            string currentPolicyId,
            string newPackageId)
        {
            var currentPolicy =
                GetPolicyById(currentPolicyId);

            var newPackage = _context.Package
                .FirstOrDefault(
                    p => p.PackageId == newPackageId
                );

            if (newPackage == null)
            {
                throw new KeyNotFoundException(
                    "New package not found."
                );
            }

            var beneficiaries = _context.Beneficiary
                .Where(
                    b => b.PolicyId == currentPolicyId
                )
                .ToList();

            currentPolicy.Discontinue();

            _context.SaveChanges();

            var newPolicy = new Policy
            {
                UserId = currentPolicy.UserId,
                PackageId = newPackageId,
                StartDate = DateTime.Now,
                Status = PolicyStatus.Active
            };

            _context.Policy.Add(newPolicy);

            _context.SaveChanges();

            int copiedCount = 0;

            foreach (var beneficiary in beneficiaries)
            {
                var newBeneficiary = new Beneficiary
                {
                    FullName = beneficiary.FullName,
                    IDNumber = beneficiary.IDNumber,
                    DateOfBirth = beneficiary.DateOfBirth,
                    Gender = beneficiary.Gender,
                    Relationship = beneficiary.Relationship,
                    Status = beneficiary.Status,
                    PolicyId = newPolicy.PolicyId
                };

                _context.Beneficiary.Add(
                    newBeneficiary
                );

                copiedCount++;
            }

            _context.SaveChanges();

            return new ChangePolicyResult
            {
                PreviousPolicyId = currentPolicyId,
                NewPolicyId = newPolicy.PolicyId,
                UserId = currentPolicy.UserId,
                PackageId = newPackageId,
                Status = newPolicy.Status.ToString(),
                BeneficiariesCopied = copiedCount
            };
        }

        // =========================================================
        // CHANGE PACKAGE
        // =========================================================

        public void ChangePackage(
            string policyId,
            string packageId)
        {
            var policy = GetPolicyById(policyId);

            var packageExists = _context.Package
                .Any(
                    p => p.PackageId == packageId
                );

            if (!packageExists)
            {
                throw new KeyNotFoundException(
                    "Package not found."
                );
            }

            policy.ChangePackage(packageId);

            _context.SaveChanges();
        }

        // =========================================================
        // DELETE POLICY
        // =========================================================

        public void DeletePolicy(string policyId)
        {
            var policy = GetPolicyById(policyId);

            _context.Policy.Remove(policy);

            _context.SaveChanges();
        }

        // =========================================================
        // ADD BENEFICIARY
        // =========================================================

        public void AddBeneficiary(
            string policyId,
            Beneficiary beneficiary)
        {
            var policy = _context.Policy
                .FirstOrDefault(
                    p => p.PolicyId == policyId
                );

            if (policy == null)
            {
                throw new KeyNotFoundException(
                    "Policy not found."
                );
            }

            beneficiary.PolicyId = policyId;

            _context.Beneficiary.Add(
                beneficiary
            );

            _context.SaveChanges();
        }

        // =========================================================
        // REMOVE BENEFICIARY
        // =========================================================

        public void RemoveBeneficiary(
            string policyId,
            string beneficiaryId)
        {
            var beneficiary = _context.Beneficiary
                .FirstOrDefault(
                    b =>
                        b.BeneficiaryId == beneficiaryId &&
                        b.PolicyId == policyId
                );

            if (beneficiary == null)
            {
                throw new KeyNotFoundException(
                    "Beneficiary not found."
                );
            }

            _context.Beneficiary.Remove(
                beneficiary
            );

            _context.SaveChanges();
        }
    }
}