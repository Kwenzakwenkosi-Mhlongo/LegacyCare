using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class LinkServiceRequestToDeathNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeathNotificationId",
                table: "ServiceRequests",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_DeathNotificationId",
                table: "ServiceRequests",
                column: "DeathNotificationId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceRequests_DeathNotifications_DeathNotificationId",
                table: "ServiceRequests",
                column: "DeathNotificationId",
                principalTable: "DeathNotifications",
                principalColumn: "DeathNotificationId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceRequests_DeathNotifications_DeathNotificationId",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_DeathNotificationId",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "DeathNotificationId",
                table: "ServiceRequests");
        }
    }
}
