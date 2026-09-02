using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class ExtendChangePackageRequestForCustomPackage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "NewPackageId",
                table: "ChangePackageRequest",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<string>(
                name: "RequestType",
                table: "ChangePackageRequest",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "NormalPackage");

            migrationBuilder.CreateIndex(
                name: "IX_ChangePackageRequest_RequestType",
                table: "ChangePackageRequest",
                column: "RequestType");

            migrationBuilder.CreateIndex(
                name: "IX_ChangePackageRequest_Status",
                table: "ChangePackageRequest",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChangePackageRequest_RequestType",
                table: "ChangePackageRequest");

            migrationBuilder.DropIndex(
                name: "IX_ChangePackageRequest_Status",
                table: "ChangePackageRequest");

            migrationBuilder.DropColumn(
                name: "RequestType",
                table: "ChangePackageRequest");

            migrationBuilder.AlterColumn<string>(
                name: "NewPackageId",
                table: "ChangePackageRequest",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);
        }
    }
}
