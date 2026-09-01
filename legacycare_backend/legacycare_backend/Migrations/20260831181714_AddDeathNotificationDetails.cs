// FILE: Migrations/20260831181714_AddDeathNotificationDetails.cs

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    public partial class AddDeathNotificationDetails : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // REQUEST NUMBER SEQUENCE
            // =========================================================

            migrationBuilder.Sql(
                """
                DECLARE @NextValue BIGINT;
                DECLARE @Sql NVARCHAR(MAX);

                SELECT
                    @NextValue =
                        ISNULL(
                            MAX(
                                TRY_CONVERT(
                                    BIGINT,
                                    SUBSTRING(
                                        RequestNumber,
                                        5,
                                        LEN(RequestNumber)
                                    )
                                )
                            ),
                            0
                        ) + 1
                FROM dbo.DeathNotifications
                WHERE
                    RequestNumber IS NOT NULL
                    AND RequestNumber LIKE 'REQ-%';

                IF @NextValue IS NULL OR @NextValue < 1
                BEGIN
                    SET @NextValue = 1;
                END;

                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.sequences
                    WHERE
                        name =
                            'DeathNotificationRequestNumberSequence'
                        AND schema_id =
                            SCHEMA_ID('dbo')
                )
                BEGIN
                    SET @Sql =
                        N'CREATE SEQUENCE dbo.DeathNotificationRequestNumberSequence ' +
                        N'AS BIGINT ' +
                        N'START WITH ' +
                        CONVERT(NVARCHAR(30), @NextValue) +
                        N' INCREMENT BY 1 ' +
                        N'MINVALUE 1 ' +
                        N'NO MAXVALUE ' +
                        N'NO CYCLE ' +
                        N'CACHE 20;';

                    EXEC sys.sp_executesql @Sql;
                END
                ELSE
                BEGIN
                    SET @Sql =
                        N'ALTER SEQUENCE dbo.DeathNotificationRequestNumberSequence ' +
                        N'RESTART WITH ' +
                        CONVERT(NVARCHAR(30), @NextValue) +
                        N';';

                    EXEC sys.sp_executesql @Sql;
                END;
                """);

            // =========================================================
            // REQUEST NUMBER COLUMN SIZE
            // =========================================================

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'RequestNumber'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ALTER COLUMN RequestNumber nvarchar(50) NULL;
                END;
                """);

            // =========================================================
            // UNIQUE REQUEST NUMBER INDEX
            // =========================================================

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name =
                            'IX_DeathNotifications_RequestNumber'
                        AND object_id =
                            OBJECT_ID(
                                'dbo.DeathNotifications'
                            )
                )
                BEGIN
                    CREATE UNIQUE INDEX
                        IX_DeathNotifications_RequestNumber
                    ON dbo.DeathNotifications
                    (
                        RequestNumber
                    )
                    WHERE RequestNumber IS NOT NULL;
                END;
                """);

            // =========================================================
            // BENEFICIARY INDEX
            // =========================================================

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name =
                            'IX_DeathNotifications_BeneficiaryId'
                        AND object_id =
                            OBJECT_ID(
                                'dbo.DeathNotifications'
                            )
                )
                BEGIN
                    CREATE INDEX
                        IX_DeathNotifications_BeneficiaryId
                    ON dbo.DeathNotifications
                    (
                        BeneficiaryId
                    );
                END;
                """);

            // =========================================================
            // STATUS INDEX
            // =========================================================

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name =
                            'IX_DeathNotifications_Status'
                        AND object_id =
                            OBJECT_ID(
                                'dbo.DeathNotifications'
                            )
                )
                BEGIN
                    CREATE INDEX
                        IX_DeathNotifications_Status
                    ON dbo.DeathNotifications
                    (
                        Status
                    );
                END;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // STATUS INDEX
            // =========================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name =
                            'IX_DeathNotifications_Status'
                        AND object_id =
                            OBJECT_ID(
                                'dbo.DeathNotifications'
                            )
                )
                BEGIN
                    DROP INDEX
                        IX_DeathNotifications_Status
                    ON dbo.DeathNotifications;
                END;
                """);

            // =========================================================
            // BENEFICIARY INDEX
            // =========================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name =
                            'IX_DeathNotifications_BeneficiaryId'
                        AND object_id =
                            OBJECT_ID(
                                'dbo.DeathNotifications'
                            )
                )
                BEGIN
                    DROP INDEX
                        IX_DeathNotifications_BeneficiaryId
                    ON dbo.DeathNotifications;
                END;
                """);

            // =========================================================
            // REQUEST NUMBER INDEX
            // =========================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE
                        name =
                            'IX_DeathNotifications_RequestNumber'
                        AND object_id =
                            OBJECT_ID(
                                'dbo.DeathNotifications'
                            )
                )
                BEGIN
                    DROP INDEX
                        IX_DeathNotifications_RequestNumber
                    ON dbo.DeathNotifications;
                END;
                """);

            // =========================================================
            // REQUEST NUMBER SEQUENCE
            // =========================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.sequences
                    WHERE
                        name =
                            'DeathNotificationRequestNumberSequence'
                        AND schema_id =
                            SCHEMA_ID('dbo')
                )
                BEGIN
                    DROP SEQUENCE
                        dbo.DeathNotificationRequestNumberSequence;
                END;
                """);
        }
    }
}