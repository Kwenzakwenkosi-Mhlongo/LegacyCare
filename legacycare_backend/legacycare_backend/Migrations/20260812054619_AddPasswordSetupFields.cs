using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordSetupFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PasswordSetupToken",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordSetupTokenExpiry",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordSetupToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordSetupTokenExpiry",
                table: "Users");
        }
    }
}
