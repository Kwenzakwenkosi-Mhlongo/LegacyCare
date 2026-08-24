using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class FixServiceRequestClientIdAndAppointmentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ServiceFee",
                table: "ServiceRequests",
                newName: "AdditionalFee");

            migrationBuilder.AddColumn<DateTime>(
                name: "AppointmentDateTime",
                table: "ServiceRequests",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppointmentDateTime",
                table: "ServiceRequests");

            migrationBuilder.RenameColumn(
                name: "AdditionalFee",
                table: "ServiceRequests",
                newName: "ServiceFee");
        }
    }
}
