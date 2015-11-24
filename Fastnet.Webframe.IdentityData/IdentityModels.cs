using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Data.Entity;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Fastnet.Webframe.CoreData
{

    // You can add profile data for the user by adding more properties to your ApplicationUser class, please visit http://go.microsoft.com/fwlink/?LinkID=317594 to learn more.
    //public class Member : IdentityUser
    public class ApplicationUser : IdentityUser
    {
        //[MaxLength(128)]
        //public string FirstName { get; set; }
        //[MaxLength(128)]
        //public string LastName { get; set; }
        //public DateTime CreationDate { get; set; }
        //public DateTime? LastLoginDate { get; set; }
        //public bool Active { get; set; }
        //public string PlainPassword { get; set; }
        //public string UserString1 { get; set; }
        //public string UserString2 { get; set; }
        //public string UserString3 { get; set; }
        //public string UserString4 { get; set; }
        //public string UserString5 { get; set; }

        //public DateTime UserDate1 { get; set; }
        //public DateTime UserDate2 { get; set; }
        //public DateTime UserDate3 { get; set; }
        //public DateTime UserDate4 { get; set; }
        //public DateTime UserDate5 { get; set; }

        //public int UserInteger1 { get; set; }
        //public int UserInteger2 { get; set; }
        //public int UserInteger3 { get; set; }
        //public int UserInteger4 { get; set; }
        //public int UserInteger5 { get; set; }

        //public bool UserFlag1 { get; set; }
        //public bool UserFlag2 { get; set; }
        //public bool UserFlag3 { get; set; }
        //public bool UserFlag4 { get; set; }
        //public bool UserFlag5 { get; set; }

        //public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<Member> manager)
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);
            // Add custom user claims here
            return userIdentity;
        }
    }

    //public class ApplicationDbContext : IdentityDbContext<Member>
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(string nameOrConnectionString)
            : base(nameOrConnectionString, throwIfV1Schema: false)
        {
        }
        public ApplicationDbContext()
            : base("CoreData", throwIfV1Schema: false)
            //: base("IdentityConnection", throwIfV1Schema: false)
        {
        }

        public static void SetInitializer()
        {
            System.Data.Entity.Database.SetInitializer(new IdentityDataInitializer());
        }
        public static ApplicationDbContext Create()
        {
            return new ApplicationDbContext();
        }
        protected override void OnModelCreating(System.Data.Entity.DbModelBuilder modelBuilder)
        {
            //modelBuilder.Conventions.Remove<OneToManyCascadeDeleteConvention>();
            //modelBuilder.Conventions.Remove<ManyToManyCascadeDeleteConvention>();
            modelBuilder.Properties<DateTime>().Configure(c => c.HasColumnType("datetime2"));
            base.OnModelCreating(modelBuilder);
        }
    }
    internal class IdentityDataInitializer : MigrateDatabaseToLatestVersion<ApplicationDbContext, Fastnet.Webframe.IdentityData.Migrations.Configuration>
    {
    }
}