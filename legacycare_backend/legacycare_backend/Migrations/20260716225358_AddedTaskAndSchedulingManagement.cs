using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PolicyManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddedTaskAndSchedulingManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Relationship",
                table: "BeneficiaryRequest",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Relationship",
                table: "Beneficiary",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateTable(
                name: "BookingRestriction",
                columns: table => new
                {
                    RestrictionId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    MaxDailyBookings = table.Column<int>(type: "int", nullable: false),
                    MinAdvanceBookingDays = table.Column<int>(type: "int", nullable: false),
                    EventStartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EventEndTime = table.Column<TimeSpan>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingRestriction", x => x.RestrictionId);
                });

            migrationBuilder.CreateTable(
                name: "Event",
                columns: table => new
                {
                    EventId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    EventType = table.Column<int>(type: "int", nullable: false),
                    EventDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Venue = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    ClientId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    DeceasedId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Event", x => x.EventId);
                    table.ForeignKey(
                        name: "FK_Event_Deceased_DeceasedId",
                        column: x => x.DeceasedId,
                        principalTable: "Deceased",
                        principalColumn: "DeceasedId");
                    table.ForeignKey(
                        name: "FK_Event_Users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Task",
                columns: table => new
                {
                    TaskId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ProofImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedToId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PolicyId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    DeceasedId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Task", x => x.TaskId);
                    table.ForeignKey(
                        name: "FK_Task_Deceased_DeceasedId",
                        column: x => x.DeceasedId,
                        principalTable: "Deceased",
                        principalColumn: "DeceasedId");
                    table.ForeignKey(
                        name: "FK_Task_Policy_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policy",
                        principalColumn: "PolicyId");
                    table.ForeignKey(
                        name: "FK_Task_Users_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventUser",
                columns: table => new
                {
                    EventId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StaffMembersUserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventUser", x => new { x.EventId, x.StaffMembersUserId });
                    table.ForeignKey(
                        name: "FK_EventUser_Event_EventId",
                        column: x => x.EventId,
                        principalTable: "Event",
                        principalColumn: "EventId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventUser_Users_StaffMembersUserId",
                        column: x => x.StaffMembersUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Event_ClientId",
                table: "Event",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_DeceasedId",
                table: "Event",
                column: "DeceasedId");

            migrationBuilder.CreateIndex(
                name: "IX_EventUser_StaffMembersUserId",
                table: "EventUser",
                column: "StaffMembersUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Task_AssignedToId",
                table: "Task",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_Task_DeceasedId",
                table: "Task",
                column: "DeceasedId");

            migrationBuilder.CreateIndex(
                name: "IX_Task_PolicyId",
                table: "Task",
                column: "PolicyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingRestriction");

            migrationBuilder.DropTable(
                name: "EventUser");

            migrationBuilder.DropTable(
                name: "Task");

            migrationBuilder.DropTable(
                name: "Event");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Relationship",
                table: "BeneficiaryRequest",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Relationship",
                table: "Beneficiary",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
        }
    }
}
