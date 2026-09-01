// FILE: Migrations/20260831215751_SyncDeathNotificationModel.cs

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    public partial class SyncDeathNotificationModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name = 'IX_DeathNotifications_RequestNumber'
                        AND object_id = OBJECT_ID('dbo.DeathNotifications')
                )
                BEGIN
                    CREATE UNIQUE INDEX
                        IX_DeathNotifications_RequestNumber
                    ON dbo.DeathNotifications(RequestNumber)
                    WHERE RequestNumber IS NOT NULL;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name = 'IX_DeathNotifications_Status'
                        AND object_id = OBJECT_ID('dbo.DeathNotifications')
                )
                BEGIN
                    CREATE INDEX
                        IX_DeathNotifications_Status
                    ON dbo.DeathNotifications(Status);
                END;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name = 'IX_DeathNotifications_Status'
                        AND object_id = OBJECT_ID('dbo.DeathNotifications')
                )
                BEGIN
                    DROP INDEX
                        IX_DeathNotifications_Status
                    ON dbo.DeathNotifications;
                END;
                """);

            /*
             * Do not remove the RequestNumber index here.
             * The earlier AddDeathNotificationDetails migration owns it.
             */
        }
    }
}