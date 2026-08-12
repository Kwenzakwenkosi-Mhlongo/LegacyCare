using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Deceased",
                columns: table => new
                {
                    DeceasedId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IDNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateOfDeath = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CauseOfDeath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PolicyId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsReleased = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Deceased", x => x.DeceasedId);
                });

            migrationBuilder.CreateTable(
                name: "Package",
                columns: table => new
                {
                    PackageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MonthlyPremium = table.Column<double>(type: "float", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaxBeneficiaries = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Package", x => x.PackageId);
                });

            migrationBuilder.CreateTable(
                name: "Role",
                columns: table => new
                {
                    RoleID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Role", x => x.RoleID);
                });

            migrationBuilder.CreateTable(
                name: "StorageUnit",
                columns: table => new
                {
                    StorageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UnitNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BranchId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StorageUnit", x => x.StorageId);
                });

            migrationBuilder.CreateTable(
                name: "UserRole",
                columns: table => new
                {
                    UserRoleID = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserID = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoleID = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRole", x => x.UserRoleID);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IDNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CellNo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "DeceasedStorage",
                columns: table => new
                {
                    AssignmentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StorageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DeceasedId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DateAssigned = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateRemoved = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeceasedStorage", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_DeceasedStorage_Deceased_DeceasedId",
                        column: x => x.DeceasedId,
                        principalTable: "Deceased",
                        principalColumn: "DeceasedId");
                    table.ForeignKey(
                        name: "FK_DeceasedStorage_StorageUnit_StorageId",
                        column: x => x.StorageId,
                        principalTable: "StorageUnit",
                        principalColumn: "StorageId");
                });

            migrationBuilder.CreateTable(
                name: "Policy",
                columns: table => new
                {
                    PolicyId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PackageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Policy", x => x.PolicyId);
                    table.ForeignKey(
                        name: "FK_Policy_Package_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Package",
                        principalColumn: "PackageId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Policy_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Beneficiary",
                columns: table => new
                {
                    BeneficiaryId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IDNumber = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: false),
                    Relationship = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PolicyId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Beneficiary", x => x.BeneficiaryId);
                    table.ForeignKey(
                        name: "FK_Beneficiary_Policy_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policy",
                        principalColumn: "PolicyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChangePackageRequest",
                columns: table => new
                {
                    RequestId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RequestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NewPackageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ClientId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PolicyId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChangePackageRequest", x => x.RequestId);
                    table.ForeignKey(
                        name: "FK_ChangePackageRequest_Package_NewPackageId",
                        column: x => x.NewPackageId,
                        principalTable: "Package",
                        principalColumn: "PackageId");
                    table.ForeignKey(
                        name: "FK_ChangePackageRequest_Policy_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policy",
                        principalColumn: "PolicyId");
                    table.ForeignKey(
                        name: "FK_ChangePackageRequest_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "BeneficiaryRequest",
                columns: table => new
                {
                    RequestId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PolicyId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RequestType = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BeneficiaryId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Relationship = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IDNumber = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BeneficiaryRequest", x => x.RequestId);
                    table.ForeignKey(
                        name: "FK_BeneficiaryRequest_Beneficiary_BeneficiaryId",
                        column: x => x.BeneficiaryId,
                        principalTable: "Beneficiary",
                        principalColumn: "BeneficiaryId");
                    table.ForeignKey(
                        name: "FK_BeneficiaryRequest_Policy_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policy",
                        principalColumn: "PolicyId");
                    table.ForeignKey(
                        name: "FK_BeneficiaryRequest_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Beneficiary_PolicyId",
                table: "Beneficiary",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_BeneficiaryRequest_BeneficiaryId",
                table: "BeneficiaryRequest",
                column: "BeneficiaryId");

            migrationBuilder.CreateIndex(
                name: "IX_BeneficiaryRequest_PolicyId",
                table: "BeneficiaryRequest",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_BeneficiaryRequest_UserId",
                table: "BeneficiaryRequest",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChangePackageRequest_NewPackageId",
                table: "ChangePackageRequest",
                column: "NewPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChangePackageRequest_PolicyId",
                table: "ChangePackageRequest",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_ChangePackageRequest_UserId",
                table: "ChangePackageRequest",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeceasedStorage_DeceasedId",
                table: "DeceasedStorage",
                column: "DeceasedId");

            migrationBuilder.CreateIndex(
                name: "IX_DeceasedStorage_StorageId",
                table: "DeceasedStorage",
                column: "StorageId");

            migrationBuilder.CreateIndex(
                name: "IX_Policy_PackageId",
                table: "Policy",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Policy_UserId",
                table: "Policy",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BeneficiaryRequest");

            migrationBuilder.DropTable(
                name: "ChangePackageRequest");

            migrationBuilder.DropTable(
                name: "DeceasedStorage");

            migrationBuilder.DropTable(
                name: "Role");

            migrationBuilder.DropTable(
                name: "UserRole");

            migrationBuilder.DropTable(
                name: "Beneficiary");

            migrationBuilder.DropTable(
                name: "Deceased");

            migrationBuilder.DropTable(
                name: "StorageUnit");

            migrationBuilder.DropTable(
                name: "Policy");

            migrationBuilder.DropTable(
                name: "Package");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
