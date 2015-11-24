using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Fastnet.Webframe.BookingData
{
    //internal class BookingDataInitializer : CreateDatabaseIfNotExists<BookingDataContext>// DropCreateDatabaseIfModelChanges<BookingDataContext>
    internal class BookingDataInitializer : MigrateDatabaseToLatestVersion<BookingDataContext, Fastnet.Webframe.BookingData.Migrations.Configuration>
    {
    }
    public partial class BookingDataContext : DbContext
    {

        public static void SetInitializer()
        {
            System.Data.Entity.Database.SetInitializer(new BookingDataInitializer());
        }
        public BookingDataContext() : base("CoreData")
        {
           
        }
        public DbSet<Accomodation> AccomodationSet { get; set; }
        public DbSet<AccomodationExtra> AccomodationExtras { get; set; }
        public DbSet<Availability> Availablities { get; set; }
        public DbSet<PriceStructure> PriceStructures { get; set; }
        public DbSet<Period> Periods { get; set; }
        public DbSet<Price> Prices { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<EntryCode> EntryCodes { get; set; }
        public DbSet<ParameterBase> Parameters { get; set; }
        public DbSet<BookingEmail> Emails { get; set; }
        public DbSet<EmailTemplate> EmailTemplates { get; set; }
        public DbSet<Tasklog> Tasklogs { get; set; }
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("book");            
            modelBuilder.Conventions.Remove<OneToManyCascadeDeleteConvention>();
            modelBuilder.Conventions.Remove<ManyToManyCascadeDeleteConvention>();
            //modelBuilder.Types().Configure(entity => entity.ToTable("book_" + entity.ClrType.Name));
            modelBuilder.Properties<DateTime>().Configure(c => c.HasColumnType("datetime2"));
        }
    }
}
