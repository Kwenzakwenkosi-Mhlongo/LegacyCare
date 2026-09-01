// ============================================================================
// FILE: Service/MortuaryManagement/RequestNumberService.cs
// ============================================================================

using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PolicyManagement.Data;

namespace PolicyManagement.Service.MortuaryManagement
{
    public class RequestNumberService : IRequestNumberService
    {
        private const string SequenceName =
            "dbo.DeathNotificationRequestNumberSequence";

        private readonly AppDbContext _context;

        public RequestNumberService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string>
            GenerateDeathNotificationRequestNumberAsync(
                CancellationToken cancellationToken = default)
        {
            var connection =
                _context.Database.GetDbConnection();

            var shouldCloseConnection =
                connection.State != ConnectionState.Open;

            if (shouldCloseConnection)
            {
                await connection.OpenAsync(cancellationToken);
            }

            try
            {
                await using var command =
                    connection.CreateCommand();

                command.CommandText =
                    $"SELECT NEXT VALUE FOR {SequenceName};";

                command.CommandType =
                    CommandType.Text;

                var currentTransaction =
                    _context.Database.CurrentTransaction;

                if (currentTransaction != null)
                {
                    command.Transaction =
                        currentTransaction.GetDbTransaction();
                }

                var result =
                    await command.ExecuteScalarAsync(
                        cancellationToken);

                if (result == null ||
                    result == DBNull.Value)
                {
                    throw new InvalidOperationException(
                        "Unable to generate a death notification request number.");
                }

                var sequenceValue =
                    Convert.ToInt64(result);

                return $"REQ-{sequenceValue:00000}";
            }
            finally
            {
                if (shouldCloseConnection)
                {
                    await connection.CloseAsync();
                }
            }
        }
    }
}