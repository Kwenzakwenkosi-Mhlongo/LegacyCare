// File: Service/UserManagement/OperationalStaffSeeder.cs

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PolicyManagement.Data;
using PolicyManagement.Enums;
using PolicyManagement.Models;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Service.UserManagement
{
    public sealed class OperationalStaffSeeder
    {
        private const int TargetStaffPerBranch = 18;

        private static readonly StaffType[] OperationalRoles =
        {
            StaffType.Driver,
            StaffType.GraveDigger,
            StaffType.MortuaryAttendant,
            StaffType.OnSiteStaff
        };

        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OperationalStaffSeeder> _logger;

        public OperationalStaffSeeder(
            AppDbContext context,
            IPasswordHasher<User> passwordHasher,
            IConfiguration configuration,
            ILogger<OperationalStaffSeeder> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SeedAsync(
            CancellationToken cancellationToken = default)
        {
            var enabled =
                _configuration.GetValue<bool>(
                    "StaffSeeding:Enabled");

            if (!enabled)
            {
                _logger.LogInformation(
                    "Operational staff seeding is disabled.");

                return;
            }

            var defaultPassword =
                _configuration[
                    "StaffSeeding:DefaultPassword"];

            if (string.IsNullOrWhiteSpace(defaultPassword))
            {
                throw new InvalidOperationException(
                    "StaffSeeding:DefaultPassword is required when staff seeding is enabled.");
            }

            if (defaultPassword.Length < 12)
            {
                throw new InvalidOperationException(
                    "Staff seeding password must contain at least 12 characters.");
            }

            var branches =
                await _context
                    .Set<Branch>()
                    .OrderBy(branch => branch.BranchId)
                    .ToListAsync(cancellationToken);

            if (branches.Count == 0)
            {
                _logger.LogWarning(
                    "No branches were found. Staff seeding was skipped.");

                return;
            }

            var users =
                await _context
                    .Set<User>()
                    .ToListAsync(cancellationToken);

            var staffRecords =
                await _context
                    .Set<Staff>()
                    .Include(staff => staff.User)
                    .ToListAsync(cancellationToken);

            var nextStaffNumber =
                GetNextStaffNumber(staffRecords);

            foreach (var branch in branches)
            {
                nextStaffNumber =
                    await SeedBranchAsync(
                        branch,
                        users,
                        staffRecords,
                        defaultPassword,
                        nextStaffNumber,
                        cancellationToken);
            }

            await _context.SaveChangesAsync(
                cancellationToken);

            _logger.LogInformation(
                "Operational staff seeding completed successfully.");
        }

        private async Task<int> SeedBranchAsync(
            Branch branch,
            List<User> users,
            List<Staff> allStaff,
            string password,
            int nextStaffNumber,
            CancellationToken cancellationToken)
        {
            var currentOperationalStaff =
                allStaff
                    .Where(staff =>
                        string.Equals(
                            staff.BranchId,
                            branch.BranchId,
                            StringComparison.OrdinalIgnoreCase))
                    .Where(staff =>
                        IsOperationalRole(
                            staff.StaffRole))
                    .Where(staff =>
                        staff.User != null &&
                        staff.User.IsActive)
                    .ToList();

            var requiredStaff =
                TargetStaffPerBranch -
                currentOperationalStaff.Count;

            if (requiredStaff <= 0)
            {
                _logger.LogInformation(
                    "Branch {BranchId} already has {Count} active operational staff.",
                    branch.BranchId,
                    currentOperationalStaff.Count);

                return nextStaffNumber;
            }

            _logger.LogInformation(
                "Branch {BranchId} currently has {Current}. Creating {Required} staff.",
                branch.BranchId,
                currentOperationalStaff.Count,
                requiredStaff);

            var existingRoleCounts =
                OperationalRoles.ToDictionary(
                    role => role,
                    role => currentOperationalStaff.Count(
                        staff =>
                            staff.StaffRole == role));

            var createdCount = 0;
            var candidateNumber = 1;

            while (createdCount < requiredStaff)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var role =
                    GetLeastRepresentedRole(
                        existingRoleCounts);

                var email =
                    BuildSeedEmail(
                        branch.BranchId,
                        role,
                        candidateNumber);

                candidateNumber++;

                var emailAlreadyExists =
                    users.Any(user =>
                        string.Equals(
                            user.Email,
                            email,
                            StringComparison.OrdinalIgnoreCase));

                if (emailAlreadyExists)
                {
                    continue;
                }

                var staffId =
                    BuildStaffId(
                        nextStaffNumber);

                while (allStaff.Any(
                    staff =>
                        string.Equals(
                            staff.StaffId,
                            staffId,
                            StringComparison.OrdinalIgnoreCase)))
                {
                    nextStaffNumber++;

                    staffId =
                        BuildStaffId(
                            nextStaffNumber);
                }

                var user =
                    CreateUser(
                        branch,
                        role,
                        candidateNumber - 1,
                        nextStaffNumber);

                user.PasswordHash =
                    _passwordHasher.HashPassword(
                        user,
                        password);

                var staff =
                    new Staff
                    {
                        StaffId = staffId,
                        StaffRole = role,
                        HireDate = DateTime.UtcNow.Date,
                        Salary = GetSalary(role),
                        IsCovered = true,
                        UserId = user.UserId,
                        BranchId = branch.BranchId,
                        User = user,
                        Branch = branch
                    };

                _context
                    .Set<User>()
                    .Add(user);

                _context
                    .Set<Staff>()
                    .Add(staff);

                users.Add(user);
                allStaff.Add(staff);

                existingRoleCounts[role]++;

                createdCount++;
                nextStaffNumber++;

                await Task.Yield();
            }

            _logger.LogInformation(
                "Created {CreatedCount} staff for branch {BranchId}.",
                createdCount,
                branch.BranchId);

            return nextStaffNumber;
        }

        private static User CreateUser(
            Branch branch,
            StaffType role,
            int branchSequence,
            int globalStaffNumber)
        {
            var user =
                new User
                {
                    UserId =
                        Guid.NewGuid().ToString(),

                    FullName =
                        BuildFullName(
                            branch,
                            role,
                            branchSequence),

                    Email =
                        BuildSeedEmail(
                            branch.BranchId,
                            role,
                            branchSequence),

                    PasswordHash =
                        string.Empty,

                    Role =
                        UserRole.Staff,

                    IDNumber =
                        BuildIdNumber(
                            branch.BranchId,
                            globalStaffNumber),

                    CellNo =
                        BuildCellNumber(
                            globalStaffNumber),

                    Address =
                        $"{branch.BranchName} LegacyCare Branch",

                    DateCreated =
                        DateTime.UtcNow,

                    IsActive =
                        true,

                    LastLogin =
                        null,

                    PasswordSetupToken =
                        null,

                    PasswordSetupTokenExpiry =
                        null
                };

            return user;
        }

        private static StaffType GetLeastRepresentedRole(
            IReadOnlyDictionary<StaffType, int> roleCounts)
        {
            return OperationalRoles
                .OrderBy(role =>
                    roleCounts[role])
                .ThenBy(role =>
                    Array.IndexOf(
                        OperationalRoles,
                        role))
                .First();
        }

        private static bool IsOperationalRole(
            StaffType role)
        {
            return role is
                StaffType.Driver or
                StaffType.GraveDigger or
                StaffType.MortuaryAttendant or
                StaffType.OnSiteStaff;
        }

        private static int GetNextStaffNumber(
            IEnumerable<Staff> staff)
        {
            var highestNumber =
                staff
                    .Select(staffRecord =>
                        ParseStaffNumber(
                            staffRecord.StaffId))
                    .DefaultIfEmpty(0)
                    .Max();

            return highestNumber + 1;
        }

        private static int ParseStaffNumber(
            string? staffId)
        {
            if (string.IsNullOrWhiteSpace(staffId))
            {
                return 0;
            }

            var value =
                staffId.Trim();

            if (value.StartsWith(
                "STA",
                StringComparison.OrdinalIgnoreCase))
            {
                value =
                    value[3..];
            }

            return int.TryParse(
                value,
                out var number)
                ? number
                : 0;
        }

        private static string BuildStaffId(
            int staffNumber)
        {
            return $"STA{staffNumber:D3}";
        }

        private static string BuildSeedEmail(
            string branchId,
            StaffType role,
            int sequence)
        {
            var cleanBranchId =
                branchId
                    .Trim()
                    .ToLowerInvariant();

            var cleanRole =
                role
                    .ToString()
                    .ToLowerInvariant();

            return
                $"{cleanRole}.{cleanBranchId}.{sequence:D2}@legacycare.seed";
        }

        private static string BuildFullName(
            Branch branch,
            StaffType role,
            int sequence)
        {
            return
                $"{GetRoleDisplayName(role)} " +
                $"{branch.BranchId} {sequence:D2}";
        }

        private static string GetRoleDisplayName(
            StaffType role)
        {
            return role switch
            {
                StaffType.Driver =>
                    "Driver",

                StaffType.GraveDigger =>
                    "Grave Digger",

                StaffType.MortuaryAttendant =>
                    "Mortuary Attendant",

                StaffType.OnSiteStaff =>
                    "On-Site Staff",

                _ =>
                    "Operational Staff"
            };
        }

        private static decimal GetSalary(
            StaffType role)
        {
            return role switch
            {
                StaffType.Driver =>
                    15000m,

                StaffType.GraveDigger =>
                    14500m,

                StaffType.MortuaryAttendant =>
                    15500m,

                StaffType.OnSiteStaff =>
                    14500m,

                _ =>
                    14500m
            };
        }

        private static string BuildIdNumber(
            string branchId,
            int staffNumber)
        {
            var branchDigits =
                new string(
                    branchId
                        .Where(char.IsDigit)
                        .ToArray());

            var branchNumber =
                int.TryParse(
                    branchDigits,
                    out var parsedBranch)
                    ? parsedBranch
                    : 0;

            var year =
                80 +
                branchNumber %
                20;

            var month =
                1 +
                staffNumber %
                12;

            var day =
                1 +
                staffNumber %
                27;

            var sequence =
                staffNumber %
                10_000_000;

            return
                $"{year:D2}" +
                $"{month:D2}" +
                $"{day:D2}" +
                $"{sequence:D7}";
        }

        private static string BuildCellNumber(
            int staffNumber)
        {
            return
                $"079{staffNumber % 10_000_000:D7}";
        }
    }
}