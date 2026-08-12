using PolicyManagement.Models.MortuaryManagement;

namespace PolicyManagement.Service.MortuaryManagement
{
    public interface IDeceasedService
    {
        IEnumerable<Deceased> GetAllDeceased();

        Deceased GetDeceasedById(string deceasedId);

        IEnumerable<Deceased> SearchDeceased(string keyword);

        Deceased RegisterDeceased(Deceased deceased);

        Deceased UpdateDeceased(
            string deceasedId,
            Deceased deceased);

        void ReleaseDeceased(string deceasedId);

        void DeleteDeceased(string deceasedId);
    }
}