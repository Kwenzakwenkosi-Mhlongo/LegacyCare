// FILE: Migrations/20260831142608_AddDeathNotificationBodyLocation.cs

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    public partial class AddDeathNotificationBodyLocation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'BodyLocationType'
                ) IS NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD BodyLocationType nvarchar(50) NULL;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'BodyLocationAddress'
                ) IS NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD BodyLocationAddress nvarchar(500) NULL;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'MortuaryName'
                ) IS NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD MortuaryName nvarchar(200) NULL;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'StorageUnitNumber'
                ) IS NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD StorageUnitNumber nvarchar(100) NULL;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'CollectionDate'
                ) IS NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD CollectionDate datetime2 NULL;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'CollectionNotes'
                ) IS NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD CollectionNotes nvarchar(1000) NULL;
                END;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'CollectionNotes'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP COLUMN CollectionNotes;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'CollectionDate'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP COLUMN CollectionDate;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'StorageUnitNumber'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP COLUMN StorageUnitNumber;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'MortuaryName'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP COLUMN MortuaryName;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'BodyLocationAddress'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP COLUMN BodyLocationAddress;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'BodyLocationType'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP COLUMN BodyLocationType;
                END;
                """);
        }
    }
}