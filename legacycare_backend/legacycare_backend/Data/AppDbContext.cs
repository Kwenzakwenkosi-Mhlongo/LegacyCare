// ============================================================================
// FILE: Data/AppDbContext.cs
// ============================================================================

using Microsoft.EntityFrameworkCore;
using PolicyManagement.Models;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Models.PaymentManagement;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Models.TaskManagement;
using PolicyManagement.Models.UserManagement;

namespace PolicyManagement.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // =====================================================
        // SERVICE REQUEST
        // =====================================================

        public DbSet<ServiceRequest> ServiceRequests { get; set; } = null!;

        // =====================================================
        // POLICY MANAGEMENT
        // =====================================================

        public DbSet<Policy> Policy { get; set; } = null!;
        public DbSet<Beneficiary> Beneficiary { get; set; } = null!;
        public DbSet<Package> Package { get; set; } = null!;
        public DbSet<ChangePackageRequest> ChangePackageRequest { get; set; } = null!;
        public DbSet<BeneficiaryRequest> BeneficiaryRequest { get; set; } = null!;
        public DbSet<PasswordSetupToken> PasswordSetupTokens { get; set; } = null!;

        // =====================================================
        // USER MANAGEMENT
        // =====================================================

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Staff> Staff { get; set; } = null!;
        public DbSet<Client> Client { get; set; } = null!;
        public DbSet<Branch> Branch { get; set; } = null!;

        // =====================================================
        // MORTUARY MANAGEMENT
        // =====================================================

        public DbSet<Storage> StorageUnit { get; set; } = null!;
        public DbSet<Deceased> Deceased { get; set; } = null!;
        public DbSet<DeceasedStorage> DeceasedStorage { get; set; } = null!;
        public DbSet<FuneralRequest> FuneralRequests { get; set; } = null!;
        public DbSet<FuneralStaffDeployment> FuneralStaffDeployments { get; set; } = null!;

        // =====================================================
        // DEATH NOTIFICATIONS
        // =====================================================

        public DbSet<DeathNotification> DeathNotifications { get; set; } = null!;

        // =====================================================
        // TASK MANAGEMENT
        // =====================================================

        public DbSet<TaskItem> Task { get; set; } = null!;

        // =====================================================
        // SCHEDULING
        // =====================================================

        public DbSet<Event> Event { get; set; } = null!;
        public DbSet<BookingRestriction> BookingRestriction { get; set; } = null!;
        public DbSet<EventUser> EventUser { get; set; } = null!;

        // =====================================================
        // PAYMENT MANAGEMENT
        // =====================================================

        public DbSet<Payment> Payment { get; set; } = null!;
        public DbSet<PaymentMethod> PaymentMethod { get; set; } = null!;
        public DbSet<Invoice> Invoice { get; set; } = null!;

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigurePolicyManagement(modelBuilder);
            ConfigureMortuaryManagement(modelBuilder);
            ConfigureDeathNotifications(modelBuilder);
            ConfigureScheduling(modelBuilder);
            ConfigureFuneralRequests(modelBuilder);
            ConfigureUserManagement(modelBuilder);
            ConfigureServiceRequests(modelBuilder);
            ConfigurePaymentManagement(modelBuilder);
            ConfigurePasswordSetupTokens(modelBuilder);

            modelBuilder.Entity<ServiceRequest>()
    .HasOne(x => x.DeathNotification)
    .WithMany()
    .HasForeignKey(x => x.DeathNotificationId)
    .OnDelete(DeleteBehavior.SetNull);

        }

        private static void ConfigurePolicyManagement(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Policy>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Policy>()
                .HasOne(p => p.Package)
                .WithMany()
                .HasForeignKey(p => p.PackageId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Beneficiary>()
                .HasOne(b => b.Policy)
                .WithMany(p => p.Beneficiaries)
                .HasForeignKey(b => b.PolicyId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BeneficiaryRequest>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<BeneficiaryRequest>()
                .HasOne(r => r.Policy)
                .WithMany()
                .HasForeignKey(r => r.PolicyId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<BeneficiaryRequest>()
                .HasOne(r => r.Beneficiary)
                .WithMany()
                .HasForeignKey(r => r.BeneficiaryId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ChangePackageRequest>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ChangePackageRequest>()
                .HasOne(r => r.Policy)
                .WithMany()
                .HasForeignKey(r => r.PolicyId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ChangePackageRequest>()
                .HasOne(r => r.NewPackage)
                .WithMany()
                .HasForeignKey(r => r.NewPackageId)
                .OnDelete(DeleteBehavior.NoAction);
        }

        private static void ConfigureMortuaryManagement(
            ModelBuilder modelBuilder)
        {
            // =====================================================
            // STORAGE
            // =====================================================

            modelBuilder.Entity<Storage>(entity =>
            {
                entity.HasKey(x => x.StorageId);

                entity.Property(x => x.StorageId)
                    .IsRequired();

                entity.Property(x => x.UnitNumber)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.BranchId)
                    .HasMaxLength(450)
                    .IsRequired();

                entity.Property(x => x.IsAvailable)
                    .IsRequired();

                entity.HasIndex(
                        x => new
                        {
                            x.BranchId,
                            x.UnitNumber
                        })
                    .IsUnique();

                entity.HasOne<Branch>()
                    .WithMany()
                    .HasForeignKey(x => x.BranchId)
                    .HasPrincipalKey(x => x.BranchId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // =====================================================
            // DECEASED
            // =====================================================

            modelBuilder.Entity<Deceased>()
                .HasOne(x => x.Beneficiary)
                .WithMany()
                .HasForeignKey(x => x.BeneficiaryId)
                .OnDelete(DeleteBehavior.Restrict);

                

            // =====================================================
            // DECEASED STORAGE
            // =====================================================

            modelBuilder.Entity<DeceasedStorage>(entity =>
            {
                entity.HasKey(x => x.AssignmentId);

                entity.Property(x => x.AssignmentId)
                    .IsRequired();

                entity.Property(x => x.StorageId)
                    .IsRequired();

                entity.Property(x => x.DeceasedId)
                    .IsRequired();

                entity.HasOne(x => x.Deceased)
                    .WithMany()
                    .HasForeignKey(x => x.DeceasedId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(x => x.Storage)
                    .WithMany()
                    .HasForeignKey(x => x.StorageId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasIndex(x => x.DeceasedId);

                entity.HasIndex(x => x.StorageId);

                /*
                 * A storage unit may only have one active
                 * deceased assignment at a time.
                 */
                entity.HasIndex(x => x.StorageId)
                    .IsUnique()
                    .HasFilter("[DateRemoved] IS NULL");
            });
        }

        private static void ConfigureDeathNotifications(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DeathNotification>(entity =>
            {
                entity.HasKey(x => x.DeathNotificationId);

                entity.Property(x => x.DeathNotificationId)
                    .IsRequired();

                entity.Property(x => x.PolicyId)
                    .IsRequired();

                entity.Property(x => x.BeneficiaryId)
                    .IsRequired();

                entity.Property(x => x.ReportedByUserId)
                    .IsRequired();

                entity.Property(x => x.BranchId)
                    .IsRequired();

                entity.Property(x => x.RequestNumber)
                    .HasMaxLength(50);

                entity.Property(x => x.RelationshipToDeceased)
                    .HasMaxLength(100);

                entity.Property(x => x.ContactPerson)
                    .HasMaxLength(200);

                entity.Property(x => x.ContactNumber)
                    .HasMaxLength(50);

                entity.Property(x => x.BodyLocationType)
                    .HasMaxLength(50);

                entity.Property(x => x.BodyLocationAddress)
                    .HasMaxLength(500);

                entity.Property(x => x.MortuaryName)
                    .HasMaxLength(200);

                entity.Property(x => x.StorageId)
                    .HasMaxLength(450);

                entity.Property(x => x.StorageUnitNumber)
                    .HasMaxLength(100);

                entity.Property(x => x.CollectionNotes)
                    .HasMaxLength(1000);

                entity.Property(x => x.RejectionReason)
                    .HasMaxLength(1000);

                // =================================================
                // INDEXES
                // =================================================

                entity.HasIndex(x => x.RequestNumber)
                    .IsUnique()
                    .HasFilter("[RequestNumber] IS NOT NULL");

                entity.HasIndex(x => x.BeneficiaryId);

                entity.HasIndex(x => x.Status);

                entity.HasIndex(x => x.StorageId);

                // =================================================
                // POLICY
                // =================================================

                entity.HasOne(x => x.Policy)
                    .WithMany()
                    .HasForeignKey(x => x.PolicyId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =================================================
                // BENEFICIARY
                // =================================================

                entity.HasOne(x => x.Beneficiary)
                    .WithMany()
                    .HasForeignKey(x => x.BeneficiaryId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =================================================
                // REPORTED BY
                // =================================================

                entity.HasOne(x => x.ReportedByUser)
                    .WithMany()
                    .HasForeignKey(x => x.ReportedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =================================================
                // VERIFIED BY
                // =================================================

                entity.HasOne(x => x.VerifiedBy)
                    .WithMany()
                    .HasForeignKey(x => x.VerifiedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =================================================
                // BRANCH
                // =================================================

                entity.HasOne(x => x.Branch)
                    .WithMany(b => b.DeathNotifications)
                    .HasForeignKey(x => x.BranchId)
                    .HasPrincipalKey(b => b.BranchId)
                    .OnDelete(DeleteBehavior.Restrict);

                // =================================================
                // RESERVED STORAGE
                // =================================================

                entity.HasOne(x => x.Storage)
                    .WithMany()
                    .HasForeignKey(x => x.StorageId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private static void ConfigureScheduling(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EventUser>()
                .HasKey(
                    eu => new
                    {
                        eu.EventId,
                        eu.UserId
                    });

            modelBuilder.Entity<EventUser>()
                .HasOne(eu => eu.Event)
                .WithMany(e => e.StaffMembers)
                .HasForeignKey(eu => eu.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EventUser>()
                .HasOne(eu => eu.User)
                .WithMany()
                .HasForeignKey(eu => eu.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        private static void ConfigureFuneralRequests(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<FuneralRequest>()
                .HasOne(x => x.DeathNotification)
                .WithMany()
                .HasForeignKey(x => x.DeathNotificationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FuneralRequest>()
                .HasOne(x => x.Client)
                .WithMany()
                .HasForeignKey(x => x.ClientId)
                .HasPrincipalKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FuneralRequest>()
                .HasOne(x => x.Branch)
                .WithMany()
                .HasForeignKey(x => x.BranchId)
                .HasPrincipalKey(b => b.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        private static void ConfigureUserManagement(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Staff>()
                .Property(s => s.StaffRole)
                .HasConversion<string>();
        }

        private static void ConfigureServiceRequests(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ServiceRequest>()
                .HasOne(x => x.Client)
                .WithMany()
                .HasForeignKey(x => x.ClientId)
                .HasPrincipalKey(x => x.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ServiceRequest>()
                .HasOne(x => x.Branch)
                .WithMany(b => b.ServiceRequests)
                .HasForeignKey(x => x.BranchId)
                .HasPrincipalKey(b => b.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ServiceRequest>()
                .Property(x => x.AdditionalFee)
                .HasPrecision(18, 2);
        }

        private static void ConfigurePaymentManagement(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");
        }

        private static void ConfigurePasswordSetupTokens(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PasswordSetupToken>()
                .HasIndex(x => x.Token)
                .IsUnique();

            modelBuilder.Entity<PasswordSetupToken>()
                .HasIndex(x => x.UserId);
        }
    }
}