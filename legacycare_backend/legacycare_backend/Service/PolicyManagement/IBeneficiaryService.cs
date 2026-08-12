using PolicyManagement.Models;

namespace PolicyManagement.Service.PolicyManagement
{
    public interface IBeneficiaryService
    {
        IEnumerable<Beneficiary> GetAllBeneficiaries();
        Beneficiary GetBeneficiaryById(string beneficiaryId);
        IEnumerable<Beneficiary> GetBeneficiariesByPolicy(string policyId);
        Beneficiary CreateBeneficiary(Beneficiary beneficiary);
        Beneficiary UpdateBeneficiary(string beneficiaryId, Beneficiary beneficiary);
        void MarkAsDeceased(string beneficiaryId);
        void RemoveBeneficiary(string beneficiaryId);
        void ReinstateBeneficiary(string beneficiaryId);
        void DeleteBeneficiary(string beneficiaryId);
    }
}