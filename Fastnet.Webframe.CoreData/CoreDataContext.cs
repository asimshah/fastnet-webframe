using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
//using System.Data.EntityClient;
using System.Linq;
using System.Reflection;

//using Regex = System.Text.RegularExpressions;

namespace Fastnet.Webframe.CoreData
{
    public enum Roles
    {
        Administrator,
        Editor,
        Contributor,
        Designer,
        Controller
    }
    public enum SystemGroups
    {
        Everyone,
        AllMembers,
        Anonymous,
        Administrators,
        Designers,
        Editors
    }
    [Flags]
    public enum GroupTypes
    {
        None = 0,
        User = 1,
        System = 2,
        SystemDefinedMembers = 4
    }
    public enum MarkupType
    {
        Html,
        [Obsolete]
        WordMl,
        DocX
    }
    public enum PageType
    {
        Centre,
        Banner,
        Left,
        Right
    }
    [Flags]
    public enum Permission
    {
        [Description("View Pages")]
        ViewPages = 1,
        [Description("Edit Pages")]
        EditPages = 2
    }
    public enum DocumentType
    {
        Normal,
        Picture,
        Audio,
        Video
    }
    public enum ImageType
    {
        Jpeg = 0,
        Png,
        Gif,
        //Emz,
        Unknown = 64
    }
    public sealed class MappedAttribute : Attribute
    {

    }
    public sealed class NonPublicColumnAttributeConvention : Convention
    {
        public NonPublicColumnAttributeConvention()
        {
            Types().Having(NonPublicProperties)
                   .Configure((config, properties) =>
                   {
                       foreach (PropertyInfo prop in properties)
                       {
                           config.Property(prop);
                       }
                   });
        }

        private IEnumerable<PropertyInfo> NonPublicProperties(Type type)
        {
            var matchingProperties = type.GetProperties(BindingFlags.SetProperty | BindingFlags.GetProperty | BindingFlags.NonPublic | BindingFlags.Instance)
                                         .Where(propInfo => propInfo.GetCustomAttributes(typeof(MappedAttribute), true).Length > 0)
                                         .ToArray();
            return matchingProperties.Length == 0 ? null : matchingProperties;
        }
    }
    public partial class CoreDataContext : DbContext
    {
        public static void SetInitializer(bool noExistingDatabase)
        {
            System.Data.Entity.Database.SetInitializer(new CoreDbInitializer(noExistingDatabase));
        }
        public CoreDataContext()
            : base("CoreData")
        {
            //Debug.Print("CoreDataContext - new instance created");
        }
        //public CoreDataContext(string cs) : base(cs)
        //{

        //}
        //public DbSet<AccessRule> AccessRules { get; set; }
        //public DbSet<Activity> Activities { get; set; }
        //public DbSet<Background> Backgrounds { get; set; }
        //public DbSet<ClientApp> ClientApps { get; set; }
        //public DbSet<CloneInformation> CloneInformata { get; set; }
        public DbSet<Directory> Directories { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<MenuMaster> MenuMasters { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<FileChunk> FileChunks { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<DirectoryGroup> DirectoryGroups { get; set; }
        public DbSet<Image> Images { get; set; }
        public DbSet<MemberBase> Members { get; set; }
        public DbSet<Page> Pages { get; set; }
        public DbSet<PageMarkup> PageMarkups { get; set; }
        public DbSet<SiteSetting> SiteSettings { get; set; }
        public DbSet<UploadFile> UploadFiles { get; set; }
        public DbSet<ActionBase> Actions { get; set; }
        public DbSet<Recorder> Recorders { get; set; }
        public DbSet<Record> Records { get; set; }
        public DbSet<Webtask> Webtasks { get; set; }
        public DbSet<SageTransaction> SageTransactions { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("std");
            modelBuilder.Conventions.Remove<OneToManyCascadeDeleteConvention>();
            modelBuilder.Conventions.Remove<ManyToManyCascadeDeleteConvention>();
            modelBuilder.Conventions.Add(new NonPublicColumnAttributeConvention());
            modelBuilder.Properties<DateTime>().Configure(c => c.HasColumnType("datetime2"));
            modelBuilder.Entity<Group>()
                .HasMany(t => t.Members)
                .WithMany(t => t.Groups)
                .Map(m =>
                {
                    m.MapLeftKey("GroupId");
                    m.MapRightKey("MemberId");
                    m.ToTable("GroupMember");
                });
            modelBuilder.Entity<Page>()
                .HasMany(t => t.Documents)
                .WithMany(t => t.Pages)
                .Map(m =>
                {
                    m.MapLeftKey("PageId");
                    m.MapRightKey("DocumentId");
                    m.ToTable("PageDocument");
                });
            modelBuilder.Entity<Page>()
                .HasMany(t => t.ForwardLinks)
                .WithMany(t => t.BackLinks)
                .Map(m =>
                {
                    m.MapLeftKey("FromPageId");
                    m.MapRightKey("ToPageId");
                    m.ToTable("PagePage");
                });
            base.OnModelCreating(modelBuilder);
        }

    }
    //public class CoreDataReadOnly : CoreDataContext
    //{
    //    public override int SaveChanges()
    //    {
    //        throw new InvalidOperationException("This context is read-only.");
    //    }
    //    public override System.Threading.Tasks.Task<int> SaveChangesAsync()
    //    {
    //        throw new InvalidOperationException("This context is read-only.");
    //    }
    //    public override System.Threading.Tasks.Task<int> SaveChangesAsync(System.Threading.CancellationToken cancellationToken)
    //    {
    //        throw new InvalidOperationException("This context is read-only.");
    //    }
    //}


}