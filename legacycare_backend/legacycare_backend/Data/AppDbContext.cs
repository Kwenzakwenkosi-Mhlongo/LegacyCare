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
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        //Policy Management
        public DbSet<Policy> Policy { get; set; }
        public DbSet<Beneficiary> Beneficiary { get; set; }
        public DbSet<Package> Package { get; set; }
        public DbSet<ChangePackageRequest> ChangePackageRequest { get; set; }
        public DbSet<BeneficiaryRequest> BeneficiaryRequest { get; set; }

        //User Management
        public DbSet<User> Users { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Client> Client { get; set; }
        public DbSet<Branch> Branch { get; set; }

        //Mortuary Management
        public DbSet<Storage> StorageUnit { get; set; }
        public DbSet<Deceased> Deceased { get; set; }
        public DbSet<DeceasedStorage> DeceasedStorage { get; set; }

        //Task Management
        public DbSet<TaskItem> Task { get; set; }

        //Scheduling Management
        public DbSet<Event> Event { get; set; }
        public DbSet<BookingRestriction> BookingRestriction { get; set; }
        public DbSet<EventUser> EventUser { get; set; }  // ← ADD THIS

        //Payment Management
        public DbSet<Payment> Payment { get; set; }
        public DbSet<PaymentMethod> PaymentMethod { get; set; }
        public DbSet<Invoice> Invoice { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // USER -> POLICY
            modelBuilder.Entity<Policy>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // PACKAGE -> POLICY
            modelBuilder.Entity<Policy>()
                .HasOne(p => p.Package)
                .WithMany()
                .HasForeignKey(p => p.PackageId)
                .OnDelete(DeleteBehavior.Restrict);

            // POLICY -> BENEFICIARY
            modelBuilder.Entity<Beneficiary>()
                .HasOne(b => b.Policy)
                .WithMany(p => p.Beneficiaries)
                .HasForeignKey(b => b.PolicyId)
                .OnDelete(DeleteBehavior.Cascade);

            // BENEFICIARY REQUEST
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

            // CHANGE PACKAGE REQUEST
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

            // DECEASED STORAGE
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

            // SCHEDULE MANAGEMENT - EVENT STAFF (Many-to-Many via EventUser)
            modelBuilder.Entity<EventUser>()
                .HasKey(eu => new { eu.EventId, eu.UserId });

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

            // ===== USER MANAGEMENT CONFIGURATIONS =====

            // UserRole conversion to string
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            // StaffType conversion to string
            modelBuilder.Entity<Staff>()
                .Property(s => s.StaffRole)
                .HasConversion<string>();

            // Payment amount decimal precision
            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");
        }
    }
}