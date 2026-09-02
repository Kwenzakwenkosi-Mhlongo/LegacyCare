using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPackageChangeRequestItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PackageChangeRequestItems",
                columns: table => new
                {
                    PackageChangeRequestItemId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RequestId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PackageItemId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    MonthlyPremiumContribution = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ServiceValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageChangeRequestItems", x => x.PackageChangeRequestItemId);
                    table.ForeignKey(
                        name: "FK_PackageChangeRequestItems_ChangePackageRequest_RequestId",
                        column: x => x.RequestId,
                        principalTable: "ChangePackageRequest",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PackageChangeRequestItems_PackageItems_PackageItemId",
                        column: x => x.PackageItemId,
                        principalTable: "PackageItems",
                        principalColumn: "PackageItemId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PackageChangeRequestItems_PackageItemId",
                table: "PackageChangeRequestItems",
                column: "PackageItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageChangeRequestItems_RequestId",
                table: "PackageChangeRequestItems",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageChangeRequestItems_RequestId_PackageItemId",
                table: "PackageChangeRequestItems",
                columns: new[] { "RequestId", "PackageItemId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PackageChangeRequestItems");
        }
    }
}
