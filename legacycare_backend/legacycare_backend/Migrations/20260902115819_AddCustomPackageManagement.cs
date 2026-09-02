using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomPackageManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PolicyCustomPackages",
                columns: table => new
                {
                    PolicyCustomPackageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PolicyId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BaseMonthlyPremium = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CustomItemsMonthlyPremium = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    EffectiveMonthlyPremium = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateUpdated = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyCustomPackages", x => x.PolicyCustomPackageId);
                    table.ForeignKey(
                        name: "FK_PolicyCustomPackages_Policy_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policy",
                        principalColumn: "PolicyId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PolicyCustomPackageItems",
                columns: table => new
                {
                    PolicyCustomPackageItemId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PolicyCustomPackageId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PackageItemId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    MonthlyPremiumContribution = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ServiceValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyCustomPackageItems", x => x.PolicyCustomPackageItemId);
                    table.ForeignKey(
                        name: "FK_PolicyCustomPackageItems_PackageItems_PackageItemId",
                        column: x => x.PackageItemId,
                        principalTable: "PackageItems",
                        principalColumn: "PackageItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PolicyCustomPackageItems_PolicyCustomPackages_PolicyCustomPackageId",
                        column: x => x.PolicyCustomPackageId,
                        principalTable: "PolicyCustomPackages",
                        principalColumn: "PolicyCustomPackageId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PolicyCustomPackageItems_PackageItemId",
                table: "PolicyCustomPackageItems",
                column: "PackageItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyCustomPackageItems_PolicyCustomPackageId",
                table: "PolicyCustomPackageItems",
                column: "PolicyCustomPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyCustomPackageItems_PolicyCustomPackageId_PackageItemId",
                table: "PolicyCustomPackageItems",
                columns: new[] { "PolicyCustomPackageId", "PackageItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PolicyCustomPackages_PolicyId",
                table: "PolicyCustomPackages",
                column: "PolicyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PolicyCustomPackageItems");

            migrationBuilder.DropTable(
                name: "PolicyCustomPackages");
        }
    }
}
