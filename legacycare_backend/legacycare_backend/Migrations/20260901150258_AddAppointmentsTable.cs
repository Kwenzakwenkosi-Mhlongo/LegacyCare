using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "FuneralRequests",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    AppointmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    ClientId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BranchId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AppointmentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PreferredDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConfirmedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ClientNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ClerkNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AssignedStaffId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    RescheduleReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConfirmedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.AppointmentId);
                    table.ForeignKey(
                        name: "FK_Appointments_Branch_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branch",
                        principalColumn: "BranchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Appointments_Client_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Client",
                        principalColumn: "ClientId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Appointments_ServiceRequests_ServiceRequestId",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_Staff_AssignedStaffId",
                        column: x => x.AssignedStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_AssignedStaffId",
                table: "Appointments",
                column: "AssignedStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_BranchId",
                table: "Appointments",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_BranchId_Status_PreferredDateTime",
                table: "Appointments",
                columns: new[] { "BranchId", "Status", "PreferredDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ClientId",
                table: "Appointments",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PreferredDateTime",
                table: "Appointments",
                column: "PreferredDateTime");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_ServiceRequestId",
                table: "Appointments",
                column: "ServiceRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Status",
                table: "Appointments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "FuneralRequests",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);
        }
    }
}
