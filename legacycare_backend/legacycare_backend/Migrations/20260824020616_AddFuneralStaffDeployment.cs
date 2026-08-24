using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddFuneralStaffDeployment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FuneralStaffDeployments",
                columns: table => new
                {
                    FuneralStaffDeploymentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FuneralRequestId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StaffId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DeployedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeployedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuneralStaffDeployments", x => x.FuneralStaffDeploymentId);
                    table.ForeignKey(
                        name: "FK_FuneralStaffDeployments_FuneralRequests_FuneralRequestId",
                        column: x => x.FuneralRequestId,
                        principalTable: "FuneralRequests",
                        principalColumn: "FuneralRequestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FuneralStaffDeployments_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FuneralStaffDeployments_FuneralRequestId",
                table: "FuneralStaffDeployments",
                column: "FuneralRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_FuneralStaffDeployments_StaffId",
                table: "FuneralStaffDeployments",
                column: "StaffId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FuneralStaffDeployments");
        }
    }
}
