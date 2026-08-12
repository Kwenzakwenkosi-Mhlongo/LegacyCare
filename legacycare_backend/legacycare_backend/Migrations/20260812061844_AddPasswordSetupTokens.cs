using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordSetupTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PasswordSetupTokens",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Used = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordSetupTokens", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PasswordSetupTokens_Token",
                table: "PasswordSetupTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordSetupTokens_UserId",
                table: "PasswordSetupTokens",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PasswordSetupTokens");
        }
    }
}
