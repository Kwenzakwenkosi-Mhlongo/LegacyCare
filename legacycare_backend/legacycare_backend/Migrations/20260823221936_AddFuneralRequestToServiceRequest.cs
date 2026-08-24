using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddFuneralRequestToServiceRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FuneralRequestId",
                table: "ServiceRequests",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_FuneralRequestId",
                table: "ServiceRequests",
                column: "FuneralRequestId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceRequests_FuneralRequests_FuneralRequestId",
                table: "ServiceRequests",
                column: "FuneralRequestId",
                principalTable: "FuneralRequests",
                principalColumn: "FuneralRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceRequests_FuneralRequests_FuneralRequestId",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_FuneralRequestId",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "FuneralRequestId",
                table: "ServiceRequests");
        }
    }
}
