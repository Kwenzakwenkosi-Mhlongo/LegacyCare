// ============================================================================
// FILE:
// Migrations/<timestamp>_AddDeathNotificationStorageReservation.cs
// ============================================================================

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    public partial class AddDeathNotificationStorageReservation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ================================================================
            // 1. VALIDATE EXISTING DATA
            // ================================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM dbo.StorageUnit
                    WHERE LEN(UnitNumber) > 100
                )
                BEGIN
                    THROW 51000,
                        'StorageUnit.UnitNumber contains values longer than 100 characters.',
                        1;
                END;

                IF EXISTS
                (
                    SELECT 1
                    FROM dbo.StorageUnit
                    WHERE LEN(BranchId) > 450
                )
                BEGIN
                    THROW 51001,
                        'StorageUnit.BranchId contains values longer than 450 characters.',
                        1;
                END;

                IF EXISTS
                (
                    SELECT 1
                    FROM dbo.StorageUnit AS s
                    LEFT JOIN dbo.Branch AS b
                        ON b.BranchId = s.BranchId
                    WHERE b.BranchId IS NULL
                )
                BEGIN
                    THROW 51002,
                        'One or more storage units reference an invalid BranchId.',
                        1;
                END;

                IF EXISTS
                (
                    SELECT 1
                    FROM dbo.StorageUnit
                    GROUP BY BranchId, UnitNumber
                    HAVING COUNT(*) > 1
                )
                BEGIN
                    THROW 51003,
                        'Duplicate storage unit numbers exist within the same branch.',
                        1;
                END;

                IF EXISTS
                (
                    SELECT 1
                    FROM dbo.DeceasedStorage
                    WHERE DateRemoved IS NULL
                    GROUP BY StorageId
                    HAVING COUNT(*) > 1
                )
                BEGIN
                    THROW 51004,
                        'A storage unit has multiple active deceased assignments.',
                        1;
                END;
                """);

            // ================================================================
            // 2. DROP STORAGE -> BRANCH FK IF IT ALREADY EXISTS
            // ================================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_StorageUnit_Branch_BranchId'
                      AND parent_object_id = OBJECT_ID('dbo.StorageUnit')
                )
                BEGIN
                    ALTER TABLE dbo.StorageUnit
                    DROP CONSTRAINT FK_StorageUnit_Branch_BranchId;
                END;
                """);

            // ================================================================
            // 3. DROP COMPOSITE INDEX IF AN EARLIER ATTEMPT CREATED IT
            // ================================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_StorageUnit_BranchId_UnitNumber'
                      AND object_id = OBJECT_ID('dbo.StorageUnit')
                )
                BEGIN
                    DROP INDEX IX_StorageUnit_BranchId_UnitNumber
                    ON dbo.StorageUnit;
                END;
                """);

            // ================================================================
            // 4. FIX BRANCHID FIRST
            //
            // This MUST happen before creating the composite index.
            // ================================================================

            migrationBuilder.Sql(
                """
                DECLARE @BranchDefaultConstraint nvarchar(300);

                SELECT @BranchDefaultConstraint =
                    QUOTENAME(dc.name)
                FROM sys.default_constraints AS dc
                INNER JOIN sys.columns AS c
                    ON c.default_object_id = dc.object_id
                WHERE dc.parent_object_id =
                          OBJECT_ID('dbo.StorageUnit')
                  AND c.name = 'BranchId';

                IF @BranchDefaultConstraint IS NOT NULL
                BEGIN
                    EXEC(
                        N'ALTER TABLE dbo.StorageUnit DROP CONSTRAINT ' +
                        @BranchDefaultConstraint
                    );
                END;

                ALTER TABLE dbo.StorageUnit
                ALTER COLUMN BranchId nvarchar(450) NOT NULL;
                """);

            // ================================================================
            // 5. FIX UNITNUMBER SECOND
            // ================================================================

            migrationBuilder.Sql(
                """
                DECLARE @UnitDefaultConstraint nvarchar(300);

                SELECT @UnitDefaultConstraint =
                    QUOTENAME(dc.name)
                FROM sys.default_constraints AS dc
                INNER JOIN sys.columns AS c
                    ON c.default_object_id = dc.object_id
                WHERE dc.parent_object_id =
                          OBJECT_ID('dbo.StorageUnit')
                  AND c.name = 'UnitNumber';

                IF @UnitDefaultConstraint IS NOT NULL
                BEGIN
                    EXEC(
                        N'ALTER TABLE dbo.StorageUnit DROP CONSTRAINT ' +
                        @UnitDefaultConstraint
                    );
                END;

                ALTER TABLE dbo.StorageUnit
                ALTER COLUMN UnitNumber nvarchar(100) NOT NULL;
                """);

            // ================================================================
            // 6. ADD DEATHNOTIFICATION.STORAGEID
            // ================================================================

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'StorageId'
                ) IS NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD StorageId nvarchar(450) NULL;
                END;
                """);

            // ================================================================
            // 7. UNIQUE STORAGE NUMBER WITHIN BRANCH
            // ================================================================

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name =
                        'IX_StorageUnit_BranchId_UnitNumber'
                      AND object_id =
                        OBJECT_ID('dbo.StorageUnit')
                )
                BEGIN
                    CREATE UNIQUE INDEX
                        IX_StorageUnit_BranchId_UnitNumber
                    ON dbo.StorageUnit
                    (
                        BranchId,
                        UnitNumber
                    );
                END;
                """);

            // ================================================================
            // 8. STORAGE -> BRANCH FK
            // ================================================================

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name =
                        'FK_StorageUnit_Branch_BranchId'
                      AND parent_object_id =
                        OBJECT_ID('dbo.StorageUnit')
                )
                BEGIN
                    ALTER TABLE dbo.StorageUnit
                    ADD CONSTRAINT
                        FK_StorageUnit_Branch_BranchId
                    FOREIGN KEY (BranchId)
                    REFERENCES dbo.Branch(BranchId);
                END;
                """);

            // ================================================================
            // 9. REPLACE DECEASEDSTORAGE INDEX WITH FILTERED UNIQUE INDEX
            // ================================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_DeceasedStorage_StorageId'
                      AND object_id =
                        OBJECT_ID('dbo.DeceasedStorage')
                )
                BEGIN
                    DROP INDEX IX_DeceasedStorage_StorageId
                    ON dbo.DeceasedStorage;
                END;

                CREATE UNIQUE INDEX
                    IX_DeceasedStorage_StorageId
                ON dbo.DeceasedStorage(StorageId)
                WHERE DateRemoved IS NULL;
                """);

            // ================================================================
            // 10. DEATH NOTIFICATION STORAGE INDEX
            // ================================================================

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name =
                        'IX_DeathNotifications_StorageId'
                      AND object_id =
                        OBJECT_ID('dbo.DeathNotifications')
                )
                BEGIN
                    CREATE INDEX
                        IX_DeathNotifications_StorageId
                    ON dbo.DeathNotifications(StorageId);
                END;
                """);

            // ================================================================
            // 11. DEATHNOTIFICATION -> STORAGE FK
            // ================================================================

            migrationBuilder.Sql(
                """
                IF NOT EXISTS
                (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name =
                        'FK_DeathNotifications_StorageUnit_StorageId'
                      AND parent_object_id =
                        OBJECT_ID('dbo.DeathNotifications')
                )
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    ADD CONSTRAINT
                        FK_DeathNotifications_StorageUnit_StorageId
                    FOREIGN KEY (StorageId)
                    REFERENCES dbo.StorageUnit(StorageId);
                END;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ================================================================
            // DEATH NOTIFICATION -> STORAGE
            // ================================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name =
                        'FK_DeathNotifications_StorageUnit_StorageId'
                )
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP CONSTRAINT
                        FK_DeathNotifications_StorageUnit_StorageId;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name =
                        'IX_DeathNotifications_StorageId'
                      AND object_id =
                        OBJECT_ID('dbo.DeathNotifications')
                )
                BEGIN
                    DROP INDEX
                        IX_DeathNotifications_StorageId
                    ON dbo.DeathNotifications;
                END;
                """);

            // ================================================================
            // STORAGE -> BRANCH
            // ================================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name =
                        'FK_StorageUnit_Branch_BranchId'
                )
                BEGIN
                    ALTER TABLE dbo.StorageUnit
                    DROP CONSTRAINT
                        FK_StorageUnit_Branch_BranchId;
                END;
                """);

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name =
                        'IX_StorageUnit_BranchId_UnitNumber'
                      AND object_id =
                        OBJECT_ID('dbo.StorageUnit')
                )
                BEGIN
                    DROP INDEX
                        IX_StorageUnit_BranchId_UnitNumber
                    ON dbo.StorageUnit;
                END;
                """);

            // ================================================================
            // DECEASED STORAGE
            // ================================================================

            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name =
                        'IX_DeceasedStorage_StorageId'
                      AND object_id =
                        OBJECT_ID('dbo.DeceasedStorage')
                )
                BEGIN
                    DROP INDEX
                        IX_DeceasedStorage_StorageId
                    ON dbo.DeceasedStorage;
                END;

                CREATE INDEX
                    IX_DeceasedStorage_StorageId
                ON dbo.DeceasedStorage(StorageId);
                """);

            // ================================================================
            // REMOVE STORAGE RESERVATION COLUMN
            // ================================================================

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(
                    'dbo.DeathNotifications',
                    'StorageId'
                ) IS NOT NULL
                BEGIN
                    ALTER TABLE dbo.DeathNotifications
                    DROP COLUMN StorageId;
                END;
                """);

            // ================================================================
            // RESTORE ORIGINAL STORAGE COLUMN TYPES
            // ================================================================

            migrationBuilder.Sql(
                """
                ALTER TABLE dbo.StorageUnit
                ALTER COLUMN UnitNumber nvarchar(max) NOT NULL;

                ALTER TABLE dbo.StorageUnit
                ALTER COLUMN BranchId nvarchar(max) NOT NULL;
                """);
        }
    }
}