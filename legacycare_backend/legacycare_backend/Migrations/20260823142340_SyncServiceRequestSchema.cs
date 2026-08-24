using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class SyncServiceRequestSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedDate",
                table: "ServiceRequests",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AssignedStaffId",
                table: "ServiceRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AdditionalFee",
                table: "ServiceRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2);

           

           
           
           

            migrationBuilder.CreateIndex(
                name: "IX_Client_BranchId",
                table: "Client",
                column: "BranchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Client_Branch_BranchId",
                table: "Client",
                column: "BranchId",
                principalTable: "Branch",
                principalColumn: "BranchId");

            
         
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Client_Branch_BranchId",
                table: "Client");

            migrationBuilder.DropForeignKey(
                name: "FK_DeathNotifications_Branch_BranchId",
                table: "DeathNotifications");

            migrationBuilder.DropIndex(
                name: "IX_DeathNotifications_BranchId",
                table: "DeathNotifications");

            migrationBuilder.DropIndex(
                name: "IX_Client_BranchId",
                table: "Client");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "DeathNotifications");

            migrationBuilder.DropColumn(
                name: "RequestNumber",
                table: "DeathNotifications");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "Client");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedDate",
                table: "ServiceRequests",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<int>(
                name: "AssignedStaffId",
                table: "ServiceRequests",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AdditionalFee",
                table: "ServiceRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldNullable: true);
        }
    }
}
