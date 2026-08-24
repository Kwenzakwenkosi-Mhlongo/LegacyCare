using Microsoft.EntityFrameworkCore;
using PolicyManagement.Models;
using PolicyManagement.Models.UserManagement;
using PolicyManagement.Models.MortuaryManagement;
using PolicyManagement.Models.TaskManagement;
using PolicyManagement.Models.ScheduleManagement;
using PolicyManagement.Models.PaymentManagement;

namespace PolicyManagement.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
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


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =====================================================
            // USER -> POLICY
            // =====================================================

            modelBuilder.Entity<Policy>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // PACKAGE -> POLICY
            // =====================================================

            modelBuilder.Entity<Policy>()
                .HasOne(p => p.Package)
                .WithMany()
                .HasForeignKey(p => p.PackageId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // POLICY -> BENEFICIARY
            // =====================================================

            modelBuilder.Entity<Beneficiary>()
                .HasOne(b => b.Policy)
                .WithMany(p => p.Beneficiaries)
                .HasForeignKey(b => b.PolicyId)
                .OnDelete(DeleteBehavior.Cascade);


            // =====================================================
            // BENEFICIARY REQUEST
            // =====================================================

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


            // =====================================================
            // CHANGE PACKAGE REQUEST
            // =====================================================

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


            // =====================================================
            // DECEASED -> BENEFICIARY
            // =====================================================

            modelBuilder.Entity<Deceased>()
                .HasOne(x => x.Beneficiary)
                .WithMany()
                .HasForeignKey(x => x.BeneficiaryId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // DECEASED STORAGE
            // =====================================================

            modelBuilder.Entity<DeceasedStorage>()
                .HasOne(ds => ds.Deceased)
                .WithMany()
                .HasForeignKey(ds => ds.DeceasedId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DeceasedStorage>()
                .HasOne(ds => ds.Storage)
                .WithMany()
                .HasForeignKey(ds => ds.StorageId)
                .OnDelete(DeleteBehavior.NoAction);


            // =====================================================
            // DEATH NOTIFICATION -> POLICY
            // =====================================================

            modelBuilder.Entity<DeathNotification>()
                .HasOne(x => x.Policy)
                .WithMany()
                .HasForeignKey(x => x.PolicyId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // DEATH NOTIFICATION -> BENEFICIARY
            // =====================================================

            modelBuilder.Entity<DeathNotification>()
                .HasOne(x => x.Beneficiary)
                .WithMany()
                .HasForeignKey(x => x.BeneficiaryId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // DEATH NOTIFICATION -> REPORTED BY USER
            // =====================================================

            modelBuilder.Entity<DeathNotification>()
                .HasOne(x => x.ReportedByUser)
                .WithMany()
                .HasForeignKey(x => x.ReportedByUserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // DEATH NOTIFICATION -> VERIFIED BY USER
            // =====================================================

            modelBuilder.Entity<DeathNotification>()
                .HasOne(x => x.VerifiedBy)
                .WithMany()
                .HasForeignKey(x => x.VerifiedByUserId)
                .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // EVENT -> USER
            // =====================================================

            modelBuilder.Entity<EventUser>()
                .HasKey(eu => new
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


                // =====================================================
// FUNERAL REQUEST -> DEATH NOTIFICATION
// =====================================================

modelBuilder.Entity<FuneralRequest>()
    .HasOne(x => x.DeathNotification)
    .WithMany()
    .HasForeignKey(x => x.DeathNotificationId)
    .OnDelete(DeleteBehavior.Restrict);

// =====================================================
// FUNERAL REQUEST -> CLIENT
// =====================================================

modelBuilder.Entity<FuneralRequest>()
    .HasOne(x => x.Client)
    .WithMany()
    .HasForeignKey(x => x.ClientId)
    .HasPrincipalKey(x => x.ClientId)
    .OnDelete(DeleteBehavior.Restrict);

// =====================================================
// FUNERAL REQUEST -> BRANCH
// =====================================================

modelBuilder.Entity<FuneralRequest>()
    .HasOne(x => x.Branch)
    .WithMany()
    .HasForeignKey(x => x.BranchId)
    .HasPrincipalKey(b => b.BranchId)
    .OnDelete(DeleteBehavior.Restrict);


            // =====================================================
            // USER MANAGEMENT
            // =====================================================

            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Staff>()
                .Property(s => s.StaffRole)
                .HasConversion<string>();


         // =====================================================
// CLIENT -> SERVICE REQUEST
// =====================================================

modelBuilder.Entity<ServiceRequest>()
    .HasOne(x => x.Client)
    .WithMany()
    .HasForeignKey(x => x.ClientId)
    .HasPrincipalKey(x => x.ClientId)
    .OnDelete(DeleteBehavior.Restrict);


// =====================================================
// BRANCH -> SERVICE REQUEST
// =====================================================

modelBuilder.Entity<ServiceRequest>()
    .HasOne(x => x.Branch)
    .WithMany(b => b.ServiceRequests)
    .HasForeignKey(x => x.BranchId)
    .HasPrincipalKey(b => b.BranchId)
    .OnDelete(DeleteBehavior.Restrict);


// =====================================================
// SERVICE REQUEST -> ADDITIONAL FEE
// =====================================================

modelBuilder.Entity<ServiceRequest>()
    .Property(x => x.AdditionalFee)
    .HasPrecision(18, 2);

            // =====================================================
            // PAYMENT
            // =====================================================

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");


            // =====================================================
            // PASSWORD SETUP TOKEN
            // =====================================================

            modelBuilder.Entity<PasswordSetupToken>()
                .HasIndex(x => x.Token)
                .IsUnique();

            modelBuilder.Entity<PasswordSetupToken>()
                .HasIndex(x => x.UserId);
        }
    }
}