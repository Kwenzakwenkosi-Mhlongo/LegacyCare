using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class ImproveMonthlyPaymentSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payment_Policy_PolicyId",
                table: "Payment");

            migrationBuilder.AlterColumn<DateTime>(
                name: "PaymentDate",
                table: "Payment",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_DueDate",
                table: "Payment",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_Payment_PolicyId_DueDate",
                table: "Payment",
                columns: new[] { "PolicyId", "DueDate" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payment_Policy_PolicyId",
                table: "Payment",
                column: "PolicyId",
                principalTable: "Policy",
                principalColumn: "PolicyId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payment_Policy_PolicyId",
                table: "Payment");

            migrationBuilder.DropIndex(
                name: "IX_Payment_DueDate",
                table: "Payment");

            migrationBuilder.DropIndex(
                name: "IX_Payment_PolicyId_DueDate",
                table: "Payment");

            migrationBuilder.AlterColumn<DateTime>(
                name: "PaymentDate",
                table: "Payment",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payment_Policy_PolicyId",
                table: "Payment",
                column: "PolicyId",
                principalTable: "Policy",
                principalColumn: "PolicyId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
