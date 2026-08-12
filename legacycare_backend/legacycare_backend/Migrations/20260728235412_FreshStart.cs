using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class FreshStart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventUser_Users_StaffMembersUserId",
                table: "EventUser");

            migrationBuilder.RenameColumn(
                name: "StaffMembersUserId",
                table: "EventUser",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_EventUser_StaffMembersUserId",
                table: "EventUser",
                newName: "IX_EventUser_UserId");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLogin",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "Payment",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "IDNumber",
                table: "Beneficiary",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(13)",
                oldMaxLength: 13);

            migrationBuilder.AddForeignKey(
                name: "FK_EventUser_Users_UserId",
                table: "EventUser",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventUser_Users_UserId",
                table: "EventUser");

            migrationBuilder.DropColumn(
                name: "LastLogin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Payment");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "EventUser",
                newName: "StaffMembersUserId");

            migrationBuilder.RenameIndex(
                name: "IX_EventUser_UserId",
                table: "EventUser",
                newName: "IX_EventUser_StaffMembersUserId");

            migrationBuilder.AlterColumn<string>(
                name: "IDNumber",
                table: "Beneficiary",
                type: "nvarchar(13)",
                maxLength: 13,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddForeignKey(
                name: "FK_EventUser_Users_StaffMembersUserId",
                table: "EventUser",
                column: "StaffMembersUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
