using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddDeathNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // DEATH NOTIFICATIONS
            // =========================================================

            migrationBuilder.CreateTable(
                name: "DeathNotifications",
                columns: table => new
                {
                    DeathNotificationId = table.Column<string>(
                        type: "nvarchar(450)",
                        nullable: false),

                    PolicyId = table.Column<string>(
                        type: "nvarchar(450)",
                        nullable: false),

                    BeneficiaryId = table.Column<string>(
                        type: "nvarchar(450)",
                        nullable: false),

                    ReportedByUserId = table.Column<string>(
                        type: "nvarchar(450)",
                        nullable: false),

                    VerifiedByUserId = table.Column<string>(
                        type: "nvarchar(450)",
                        nullable: true),

                    DateOfDeath = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    DateReported = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    ProofOfDeathDocument = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    DocumentFileName = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: true),

                    Status = table.Column<int>(
                        type: "int",
                        nullable: false),

                    RejectionReason = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_DeathNotifications",
                        x => x.DeathNotificationId);

                    table.ForeignKey(
                        name: "FK_DeathNotifications_Beneficiary_BeneficiaryId",
                        column: x => x.BeneficiaryId,
                        principalTable: "Beneficiary",
                        principalColumn: "BeneficiaryId",
                        onDelete: ReferentialAction.Restrict);

                    table.ForeignKey(
                        name: "FK_DeathNotifications_Policy_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policy",
                        principalColumn: "PolicyId",
                        onDelete: ReferentialAction.Restrict);

                    table.ForeignKey(
                        name: "FK_DeathNotifications_Users_ReportedByUserId",
                        column: x => x.ReportedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);

                    table.ForeignKey(
                        name: "FK_DeathNotifications_Users_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            // =========================================================
            // INDEXES FOR DEATH NOTIFICATIONS
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_DeathNotifications_BeneficiaryId",
                table: "DeathNotifications",
                column: "BeneficiaryId");

            migrationBuilder.CreateIndex(
                name: "IX_DeathNotifications_PolicyId",
                table: "DeathNotifications",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_DeathNotifications_ReportedByUserId",
                table: "DeathNotifications",
                column: "ReportedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeathNotifications_VerifiedByUserId",
                table: "DeathNotifications",
                column: "VerifiedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeathNotifications");
        }
    }
}