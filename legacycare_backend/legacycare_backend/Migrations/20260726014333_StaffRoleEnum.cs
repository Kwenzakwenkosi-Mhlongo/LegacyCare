using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class StaffRoleEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Staff",
                newName: "StaffRole");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StaffRole",
                table: "Staff",
                newName: "Type");
        }
    }
}
