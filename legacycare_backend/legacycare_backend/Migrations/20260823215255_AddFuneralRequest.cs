using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddFuneralRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FuneralRequests",
                columns: table => new
                {
                    FuneralRequestId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DeathNotificationId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClientId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BranchId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    FuneralDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FuneralTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    Venue = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FuneralType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuneralRequests", x => x.FuneralRequestId);
                    table.ForeignKey(
                        name: "FK_FuneralRequests_Branch_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branch",
                        principalColumn: "BranchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FuneralRequests_Client_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Client",
                        principalColumn: "ClientId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FuneralRequests_DeathNotifications_DeathNotificationId",
                        column: x => x.DeathNotificationId,
                        principalTable: "DeathNotifications",
                        principalColumn: "DeathNotificationId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FuneralRequests_BranchId",
                table: "FuneralRequests",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_FuneralRequests_ClientId",
                table: "FuneralRequests",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_FuneralRequests_DeathNotificationId",
                table: "FuneralRequests",
                column: "DeathNotificationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FuneralRequests");
        }
    }
}
