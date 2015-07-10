using Fastnet.Common;
using Fastnet.EventSystem;
using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations.Schema;
using System.Configuration;
using System.Data.Entity;
using System.Data.Entity.Core.EntityClient;
using System.Data.Entity.Core.Metadata.Edm;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.ModelConfiguration.Conventions;
//using System.Data.EntityClient;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Transactions;
using System.Web;
using System.Web.Hosting;
using System.Web.Security;
using LDB = Fastnet.Webframe.Web.DataModel;
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
        public static void SetInitializer()
        {
            System.Data.Entity.Database.SetInitializer(new CoreDbInitializer());
        }
        public CoreDataContext()
            : base("CoreData")
        {

        }
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
        //public DbSet<Font> Fonts { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<DirectoryGroup> DirectoryGroups { get; set; }
        public DbSet<Image> Images { get; set; }
        public DbSet<Member> Members { get; set; }
        //public DbSet<Menu> Menus { get; set; }
        public DbSet<Page> Pages { get; set; }
        public DbSet<PageMarkup> PageMarkups { get; set; }
        //public DbSet<Panel> Panels { get; set; }
        public DbSet<SiteSetting> SiteSettings { get; set; }
        //public DbSet<Style> Styles { get; set; }
        public DbSet<UploadFile> UploadFiles { get; set; }
        public DbSet<ActionBase> Actions { get; set; }
        public DbSet<Recorder> Recorders { get; set; }
        public DbSet<Record> Records { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Conventions.Remove<OneToManyCascadeDeleteConvention>();
            modelBuilder.Conventions.Remove<ManyToManyCascadeDeleteConvention>();
            modelBuilder.Conventions.Add(new NonPublicColumnAttributeConvention());
            modelBuilder.Properties<DateTime>().Configure(c => c.HasColumnType("datetime2"));

            //modelBuilder.Entity<Group>()
            //    .HasMany(t => t.RegistrationKeys)
            //    .WithMany(t => t.Groups)
            //    .Map(m =>
            //    {
            //        m.MapLeftKey("GroupId");
            //        m.MapRightKey("RegistrationKeyId");
            //        m.ToTable("GroupRegistrationKey");
            //    });
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
    public class CoreDataReadOnly : CoreDataContext
    {
        public override int SaveChanges()
        {
            throw new InvalidOperationException("This context is read-only.");
        }
        public override System.Threading.Tasks.Task<int> SaveChangesAsync()
        {
            throw new InvalidOperationException("This context is read-only.");
        }
        public override System.Threading.Tasks.Task<int> SaveChangesAsync(System.Threading.CancellationToken cancellationToken)
        {
            throw new InvalidOperationException("This context is read-only.");
        }
    }
    public class DataSeeder
    {
        private CoreDataContext ctx;
        public DataSeeder(CoreDataContext context)
        {
            ctx = context;
        }
        public void Seed()
        {
            bool isEmpty = IsDatabaseCompletelyEmpty();
            if (isEmpty && ApplicationSettings.Key("LegacyDataLoad", false))
            {
                LoadLegacyData();
                CreateDefaultMenu(true); // create the default menu but disable it
                EnsureRequiredGroups();
                EnsureAdministratorInAdministratorsGroup();
                SetSiteVersion("4.0.0.0");
                //WriteCustomStylesheets();
            }
            else
            {
                //EnsureClientApplications();
                EnsureRequiredGroups();
                //EnsureRequiredPanels();
                EnsureInitialPages();
                CreateDefaultMenu();
                SetSiteVersion("4.0.0.0");
                //// this will need addtion in cases of a v4 upgrade
                //WriteMainStylesheets();
                ////ClearCustomStylesheets();
            }
            EnsureAnonymousMember();
            EnsureRootDirectoryRestrictions();
        }

        private void CreateDefaultMenu(bool disable = false)
        {
            Menu home = new Menu { Text = "Home", Index = 0, Url = "home" };
            ctx.Menus.Add(home);
            Menu apps = new Menu { Text = "Apps", Index = 1 };
            {
                Menu cms = new Menu { Text = "CMS", ParentMenu = apps, Index = 0, Url = "cms" };
                ctx.Menus.Add(cms);
                //{
                //    Menu2 m2_s1_s1 = new Menu2 { Text = "page/24", ParentMenu = m2_s1, Index = 0, Url = "page/24" };
                //    ctx.NewMenus.Add(m2_s1_s1);
                //    Menu2 m2_s1_s2 = new Menu2 { Text = "page/28", ParentMenu = m2_s1, Index = 0, Url = "page/28" };
                //    ctx.NewMenus.Add(m2_s1_s2);
                //}
                Menu designer = new Menu { Text = "Designer", ParentMenu = apps, Index = 1, Url = "designer" };
                ctx.Menus.Add(designer);
                Menu membership = new Menu { Text = "Membership", ParentMenu = apps, Index = 2, Url = "membership" };
                ctx.Menus.Add(membership);
            }

            Menu login = new Menu { Text = "Login", Index = 2, Url = "login" };
            //{
            //    Menu2 m3_s1 = new Menu2 { Text = "Home", ParentMenu = login, Index = 0, Url = "home" };
            //    ctx.NewMenus.Add(m3_s1);
            //}
            ctx.Menus.Add(login);
            Menu logout = new Menu { Text = "Logout", Index = 4, Url = "logout" };
            ctx.Menus.Add(logout);
            //
            MenuMaster mm = new MenuMaster
            {
                Name = "default-menu",
                PanelName = PanelNames.MenuPanel,
                IsDisabled = disable
            };
            mm.Menus.Add(home);
            mm.Menus.Add(apps);
            mm.Menus.Add(login);
            mm.Menus.Add(logout);
            ctx.MenuMasters.Add(mm);
        }

        private void EnsureRootDirectoryRestrictions()
        {
            Group everyone = ctx.Groups.ToArray().Single(x => x.Name == SystemGroups.Everyone.ToString() && x.Type.HasFlag(GroupTypes.System));
            Group editors = ctx.Groups.ToArray().Single(x => x.Name == SystemGroups.Editors.ToString() && x.Type.HasFlag(GroupTypes.System));
            var rootDirectory = ctx.Directories.Single(x => x.ParentDirectory == null);
            var dg = rootDirectory.DirectoryGroups.SingleOrDefault(x => x.Group.GroupId == everyone.GroupId);
            if (dg == null)
            {
                dg = new DirectoryGroup { Group = everyone, Directory = rootDirectory };
                ctx.DirectoryGroups.Add(dg);
            }
            dg.SetView(true);
            dg = rootDirectory.DirectoryGroups.SingleOrDefault(x => x.Group.GroupId == editors.GroupId);
            if (dg == null)
            {
                dg = new DirectoryGroup { Group = editors, Directory = rootDirectory };
                ctx.DirectoryGroups.Add(dg);
            }
            dg.SetEdit(true);
            ctx.SaveChanges();
            //if (rootDirectory.DirectoryGroups.Count() != 1 || rootDirectory.DirectoryGroups.First().Group.GroupId != everyone.GroupId || rootDirectory.DirectoryGroups.First().Permission != Permission.ViewPages)
            //{
            //    var dgList = rootDirectory.DirectoryGroups.ToArray();
            //    ctx.DirectoryGroups.RemoveRange(dgList);
            //    DirectoryGroup dg = new DirectoryGroup { Directory = rootDirectory, Group = Group.Everyone, Permission = Permission.ViewPages };
            //    ctx.DirectoryGroups.Add(dg);
            //    ctx.SaveChanges();
            //}
        }

        private void EnsureAnonymousMember()
        {
            Group anonymousGroup = ctx.Groups.ToArray().Single(x => x.Name == SystemGroups.Anonymous.ToString() && x.Type.HasFlag(GroupTypes.System));
            var anonymous = ctx.Members.SingleOrDefault(x => x.IsAnonymous);
            if (anonymous == null)
            {
                anonymous = new Member
                {
                    Id = "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz", // this can never be a ligitimate guid
                    EmailAddress = "",
                    EmailAddressConfirmed = true,
                    FirstName = "",
                    LastName = "Anonymous",
                    CreationDate = DateTime.UtcNow,
                    PlainPassword = "",
                    IsAnonymous = true
                };
                ctx.Members.Add(anonymous);
                anonymousGroup.Members.Add(anonymous);
                ctx.SaveChanges();
                // **NB** the single anonymous memner is NOT added to the Identity system as
                // no one can login as anonymous (by definition)
            }
            var test = ctx.Members.SingleOrDefault(x => x.IsAnonymous);
        }
        //private void WriteCustomStylesheets()
        //{
        //    var customStylesheetFolder = LayoutFiles.GetCustomStylesheetFolder();// CSSRule.GetCustomCSSFolder();
        //    var mainStylesheetFolder = LayoutFiles.GetMainStylesheetFolder();// CSSRule.GetDefaultCSSFolder();
        //    Action<string, string> writeStylesheets = (sheetName, text) =>
        //    {
        //        //System.IO.File.WriteAllText(System.IO.Path.Combine(customStylesheetFolder, "BannerPanel.less"), bannerRule.ToString());
        //        //System.IO.File.WriteAllText(System.IO.Path.Combine(mainStylesheetFolder, "BannerPanel.user.css"), bannerRule.ToString());
        //        string filename = System.IO.Path.Combine(mainStylesheetFolder, sheetName + ".user.css");
        //        System.IO.File.WriteAllText(filename, text);
        //        filename = System.IO.Path.Combine(customStylesheetFolder, sheetName + ".less");// sheetName + ".less";
        //        System.IO.File.WriteAllText(filename, text);
        //    };
        //    Func<string, int> getLeadingNumber = (s) =>
        //    {
        //        var chars = s.TakeWhile(c => char.IsDigit(c));//.ToString();
        //        string text = new string(chars.ToArray());
        //        return Convert.ToInt32(text);
        //    };
        //    Func<string, CSSRule, string> getRule = (name, rule) =>
        //    {
        //        string text = rule.Rules.SingleOrDefault(x => x.StartsWith(name));
        //        //string text = set.SelectMany(x => x.Rules).SingleOrDefault(x => x.StartsWith(name));
        //        if (text != null)
        //        {
        //            string[] parts = text.Split(':');
        //            return parts[1].Trim();
        //        }
        //        return string.Empty;
        //    };

        //    string siteCss = Panel.SitePanel.GetCSSString();
        //    string bannerCss = Panel.BannerPanel.GetCSSString();
        //    string menuCss = Panel.MenuPanel.GetCSSString();
        //    string leftCss = Panel.LeftPanel.GetCSSString();
        //    string centreCss = Panel.CentrePanel.GetCSSString();
        //    string rightCss = Panel.RightPanel.GetCSSString();
        //    CSSRule bannerRule = CSSRule.ParseForRules(bannerCss).First();
        //    CSSRule menuRule = CSSRule.ParseForRules(menuCss).First();
        //    CSSRule siteRule = CSSRule.ParseForRules(siteCss).First();
        //    CSSRule centreRule = CSSRule.ParseForRules(centreCss).First();
        //    CSSRule leftRule = CSSRule.ParseForRules(leftCss).First();
        //    CSSRule rightRule = CSSRule.ParseForRules(rightCss).First();
        //    string width = getRule("width", centreRule);
        //    int cw = 0;
        //    if (width == null || ((cw = getLeadingNumber(width)) == 0))
        //    {
        //        // centre panel has no width, i.e. fluid layout
        //        siteRule.RemoveRule("width");
        //    }
        //    else
        //    {
        //        // centre panel has a width - fixed width
        //        // we need to add up left + centre + right and make that the site panel
        //        int lw = 0, rw = 0;
        //        string leftDisplay = getRule("display", leftRule);
        //        if (leftDisplay != "none")
        //        {
        //            lw = getLeadingNumber(getRule("width", leftRule));
        //        }
        //        string rightDisplay = getRule("display", rightRule);
        //        if (rightDisplay != "none")
        //        {
        //            rw = getLeadingNumber(getRule("width", rightRule));
        //        }
        //        int sw = lw + cw + rw;
        //        centreRule.RemoveRule("width");
        //        siteRule.RemoveRule("width");
        //        siteRule.AddRule("width: {0}px", sw);
        //    }
        //    writeStylesheets("BannerPanel", bannerRule.ToString());
        //    writeStylesheets("MenuPanel", menuRule.ToString());
        //    writeStylesheets("SitePanel", siteRule.ToString());
        //    writeStylesheets("LeftPanel", leftRule.ToString());
        //    writeStylesheets("CentrePanel", centreRule.ToString());
        //    writeStylesheets("RightPanel", rightRule.ToString());

        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(customStylesheetFolder, "BannerPanel.less"), bannerRule.ToString());
        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(mainStylesheetFolder, "BannerPanel.user.css"), bannerRule.ToString());

        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(customStylesheetFolder, "MenuPanel.less"), menuRule.ToString());
        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(mainStylesheetFolder, "MenuPanel.user.css"), menuRule.ToString());

        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(customStylesheetFolder, "SitePanel.less"), siteRule.ToString());
        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(mainStylesheetFolder, "SitePanel.user.css"), siteRule.ToString());

        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(customStylesheetFolder, "LeftPanel.less"), leftRule.ToString());
        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(mainStylesheetFolder, "LeftPanel.user.css"), leftRule.ToString());

        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(customStylesheetFolder, "CentrePanel.less"), centreRule.ToString());
        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(mainStylesheetFolder, "CentrePanel.user.css"), centreRule.ToString());

        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(customStylesheetFolder, "RightPanel.less"), rightRule.ToString());
        //    //System.IO.File.WriteAllText(System.IO.Path.Combine(mainStylesheetFolder, "RightPanel.user.css"), rightRule.ToString());
        //}
        private void ClearCustomStylesheets()
        {
            Action<string, string> writeStylesheet = (sheetName, text) =>
            {
                string filename = sheetName + ".less";
                System.IO.File.WriteAllText(filename, text);
            };
            Dictionary<string, string> emptyCSS = new Dictionary<string, string>()
            {
                //{"BrowserPanel", ".BrowserPanel\n{\n}\n"},
                {"SitePanel", ".SitePanel\n{\n}\n"},
                {"BannerPanel", ".BannerPanel\n{\n}\n"},
                {"MenuPanel", ".MenuPanel\n{\n}\n"},
                {"ContentPanel", ".ContentPanel\n{\n}\n"},
                {"LeftPanel", ".LeftPanel\n{\n}\n"},
                {"CentrePanel", ".CentrePanel\n{\n}\n"},
                {"RightPanel", ".RightPanel\n{\n}\n"},
            };
            var folder = LayoutFiles.GetCustomStylesheetFolder();
            foreach (var item in emptyCSS)
            {
                var panel = item.Key;
                var cssText = item.Value;
                string sheetName = System.IO.Path.Combine(folder, panel);
                writeStylesheet(sheetName, cssText);
            }
            var userFiles = System.IO.Directory.EnumerateFiles(folder, "*.user.css");
            foreach (var userFile in userFiles)
            {
                System.IO.File.Delete(userFile);
                Log.Write("{0} deleted", userFile);
            }
        }
        private void WriteMainStylesheets()
        {
            Action<string, string> writeStylesheets = (sheetName, text) =>
            {
                string filename = sheetName + ".css";
                System.IO.File.WriteAllText(filename, text);
                filename = sheetName + ".less";
                System.IO.File.WriteAllText(filename, text);
            };
            var folder = LayoutFiles.GetMainStylesheetFolder();
            Dictionary<string, string> defaultCSS = new Dictionary<string, string>()
            {
                {"BrowserPanel", ".BrowserPanel\n{\n}\n"},
                {"SitePanel", ".SitePanel\n{\n    margin: 0 auto;\n    font-family: verdana;\n    font-size: 10.5pt;\n    width: 840px;\n}\n"},
                {"BannerPanel", ".BannerPanel\n{\n    height: 88px;\n}\n"},
                {"MenuPanel", ".MenuPanel\n{\n    background-color: #aaaaaa;\n}\n"},
                {"ContentPanel", ".ContentPanel\n{\n}\n"},
                {"LeftPanel", ".LeftPanel\n{\n    width: 210px;\n}\n"},
                {"CentrePanel", ".CentrePanel\n{\n}\n"},
                {"RightPanel", ".RightPanel\n{\n    display: none;\n}\n"},
            };
            foreach (var item in defaultCSS)
            {
                var panel = item.Key;
                var cssText = item.Value;
                string sheetName = System.IO.Path.Combine(folder, panel);
                writeStylesheets(sheetName, cssText);
            }
            //var menuCssText = ".menu-normal\n{\n    font-family: Arial Black;\n    font-size: 10pt;\n    background-color: #1b76bc;\n    color: #ffffff;\n}\n\n.menu-hover:hover\n{\n    background-color: #28aae1;\n    color: #000000;\n}\n";
            //string menuCssFile = System.IO.Path.Combine(folder, "Menu");
            //writeStylesheets(menuCssFile, menuCssText);
        }
        private void EnsureInitialPages()
        {
            bool rootExists = ctx.Directories.SingleOrDefault(x => x.Name == "$root") != null;
            if (!rootExists)
            {
                Directory root = new Directory { Name = "$root" };
                Group everyone = ctx.Groups.ToArray().Single(gp => gp.Type.HasFlag(GroupTypes.System) && gp.Name == "Everyone");
                //AccessRule viewRule = new AccessRule { Permission = Permission.ViewPages, Allow = true };
                //DirectoryAccessRule dar = new DirectoryAccessRule { AccessRule = viewRule, Group = everyone, Directory = root };
                //root.DirectoryAccessRules.Add(dar);
                ctx.Directories.Add(root);
                //
                Directory sitePages = new Directory();
                sitePages.Name = "Site Pages";
                sitePages.ParentDirectory = root;
                ctx.Directories.Add(sitePages);
                ctx.SaveChanges();
                //
                Page landingPage = AddInitialPages(root);
                //CreateDefaultMenu(landingPage);
            }
        }
        //private Menu CreateDefaultMenu(Page landingPage)
        //{
        //    Menu defaultMenu = new Menu();
        //    defaultMenu.LastModified = DateTime.UtcNow;
        //    defaultMenu.Page = landingPage;
        //    defaultMenu.Url = string.Format("/page/{0}", landingPage.PageId);
        //    defaultMenu.SubMenuPixelHeight = 34;
        //    defaultMenu.SubMenuPixelWidth = 162;
        //    defaultMenu.Text = "Master Style";
        //    defaultMenu.InheritParentStyles = false;
        //    defaultMenu.Visible = true;
        //    ctx.Menus.Add(defaultMenu);
        //    defaultMenu.NormalStyle = new Style();
        //    defaultMenu.NormalStyle.VerticalAlignment = "Middle";
        //    defaultMenu.NormalStyle.Background = new Background { Colour = "#1b76bc" };// a kind of blue
        //    defaultMenu.NormalStyle.Colour = "#ffffff";
        //    defaultMenu.NormalStyle.Font = new Font { Name = "Arial Black", PointSize = 10 };
        //    defaultMenu.HoverStyle = new Style();
        //    defaultMenu.HoverStyle.Background = new Background { Colour = "#28aae1" };
        //    defaultMenu.HoverStyle.Colour = "#000000";
        //    ctx.Fonts.Add(defaultMenu.NormalStyle.Font);
        //    ctx.Backgrounds.Add(defaultMenu.NormalStyle.Background);
        //    ctx.Backgrounds.Add(defaultMenu.HoverStyle.Background);
        //    ctx.Styles.Add(defaultMenu.NormalStyle);
        //    ctx.Styles.Add(defaultMenu.HoverStyle);

        //    ctx.SaveChanges();
        //    return defaultMenu;
        //}
        private Page AddInitialPages(Directory directory)
        {
            //var lPanel = ctx.Panels.Where(p => p.Name == "LeftPanel").Single();
            //var bPanel = ctx.Panels.Where(p => p.Name == "BannerPanel").Single();

            Page bannerPage = AddHtmlPage(directory, "Banner.html", PageType.Banner);
            Page homePage = AddHtmlPage(directory, "Home Page.html", PageType.Centre);
            homePage.IsLandingPage = true;
            //AccessRule rule = GetAccessRule(Permission.ViewPages, true);
            //int groupType = (int)GroupTypes.System | (int)GroupTypes.SystemDefinedMembers;
            //GroupTypes gt = GroupTypes.System | GroupTypes.SystemDefinedMembers;
            //Group group = ctx.Groups.Single(g => g.Name == "Everyone" && g.Type.HasFlag(gt));
            //PageAccessRule par = new PageAccessRule();
            //par.AccessRule = rule;
            //par.Group = group;
            //par.Page = homePage;
            //ctx.PageAccessRules.Add(par);
            Page leftPage = AddHtmlPage(directory, "Left side panel.html", PageType.Left);// AddPage(directory, "Left side panel.docx");
            //leftPage.IsSidePage = bannerPage.IsSidePage = true;
            //ctx.PanelPages.Add(new PanelPage { CentrePage = homePage, Panel = bPanel, Page = bannerPage, Timestamp = BitConverter.GetBytes(1) });
            //ctx.PanelPages.Add(new PanelPage { CentrePage = homePage, Panel = lPanel, Page = leftPage, Timestamp = BitConverter.GetBytes(1) });
            ctx.SaveChanges();

            return homePage;
        }
        //private AccessRule GetAccessRule(Permission permission, bool allow)
        //{
        //    AccessRule rule = ctx.AccessRules.SingleOrDefault(r => r.Allow == allow && r.Permission == permission);
        //    if (rule == null)
        //    {
        //        rule = new AccessRule { Permission = permission, Allow = allow };
        //        ctx.AccessRules.Add(rule);
        //    }
        //    return rule;
        //}
        private Page AddHtmlPage(Directory directory, string htmlFilename, PageType type)
        {
            try
            {
                string defaultPagesFolder = HostingEnvironment.MapPath("~/Default Pages");
                //string docxFullname = System.IO.Path.Combine(defaultPagesFolder, htmlFilename);
                htmlFilename = System.IO.Path.Combine(defaultPagesFolder, htmlFilename);
                //byte[] docxData = System.IO.File.ReadAllBytes(docxFullname);
                //byte[] htmlData = System.IO.File.ReadAllBytes(htmlFileName);
                string htmlString = System.IO.File.ReadAllText(htmlFilename, Encoding.Default);// Encoding.Default.GetString(htmlData);// System.IO.File.ReadAllText(htmlFileName);
                Page page = ctx.CreateNewPage();// new Page();
                page.Name = System.IO.Path.GetFileNameWithoutExtension(htmlFilename);
                page.Type = type;
                //page.TimeStamp = BitConverter.GetBytes(-1);
                page.Visible = true;
                page.VersionCount = 0;
                page.Locked = true;
                directory.Pages.Add(page);
                //
                PageMarkup pm = page.PageMarkup;// new PageMarkup();
                pm.CreatedBy = "Administrator";
                pm.CreatedOn = DateTime.UtcNow;
                //pm.VersionNumber = page.VersionCount;
                //pm.TimeStamp = BitConverter.GetBytes(-1);
                //
                pm.Data = null;// docxData;
                pm.MarkupLength = 0;// docxData.Length;
                pm.HtmlText = htmlString;// GetHtmlPageFragment(htmlString);
                pm.HtmlTextLength = pm.HtmlText.Length;
                //pm.HtmlStyles = GetHtmlStyles(htmlString);
                // pm.HtmlScripts ??????
                page.MarkupType = MarkupType.Html;
                page.PageMarkup = pm;
                return page;
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        private Page AddPage(Directory directory, string docxFilename, PageType type)
        {

            try
            {
                string defaultPagesFolder = HostingEnvironment.MapPath("~/Default Pages");// HttpContext.Current.Server.MapPath("~/Default Pages");
                string docxFullname = System.IO.Path.Combine(defaultPagesFolder, docxFilename);
                string htmlFileName = System.IO.Path.Combine(defaultPagesFolder, System.IO.Path.GetFileNameWithoutExtension(docxFilename) + ".htm");
                byte[] docxData = System.IO.File.ReadAllBytes(docxFullname);
                byte[] htmlData = System.IO.File.ReadAllBytes(htmlFileName);
                string htmlString = Encoding.Default.GetString(htmlData);// System.IO.File.ReadAllText(htmlFileName);
                Page page = ctx.CreateNewPage();// new Page();
                page.Type = type;
                page.Name = System.IO.Path.GetFileNameWithoutExtension(docxFilename);
                //page.TimeStamp = BitConverter.GetBytes(-1);
                page.Visible = true;
                page.VersionCount = 0;
                page.Locked = true;
                directory.Pages.Add(page);
                //
                PageMarkup pm = page.PageMarkup;// new PageMarkup();
                pm.CreatedBy = "Administrator";
                pm.CreatedOn = DateTime.UtcNow;
                //pm.VersionNumber = page.VersionCount;
                //pm.TimeStamp = BitConverter.GetBytes(-1);
                //
                pm.Data = docxData;
                pm.MarkupLength = docxData.Length;
                pm.HtmlText = GetHtmlPageFragment(htmlString);
                pm.HtmlTextLength = pm.HtmlText.Length;
                pm.HtmlStyles = GetHtmlStyles(htmlString);
                // pm.HtmlScripts ??????
                page.MarkupType = MarkupType.DocX;
                page.PageMarkup = pm;
                return page;
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
        private string GetHtmlPageFragment(string htmlText)
        {
            string backgroundColour = null;
            string pageContent;
            HtmlDocument doc = new HtmlDocument();
            doc.LoadHtml(htmlText);
            HtmlNode contentDiv = doc.DocumentNode.SelectSingleNode("/html/body/div[1]");
            HtmlNode bodyNode = contentDiv.ParentNode;
            string colour = bodyNode.GetAttributeValue("bgcolor", "");
            if (colour.Length > 0)
            {
                //Log.Write("Background colour is {0}", colour);
                backgroundColour = colour;
            }
            AddClassNamesToLinks(contentDiv);
            pageContent = contentDiv.InnerHtml;
            if (backgroundColour != null)
            {
                return string.Format(@"<div style=""width:100%;background-color:{0};"">{1}</div>", backgroundColour, pageContent);
            }
            else
            {
                return string.Format(@"<div style=""width:100%"">{0}</div>", pageContent);
            }
        }
        private string GetHtmlStyles(string htmlText)
        {
            HtmlDocument doc = new HtmlDocument();
            doc.LoadHtml(htmlText);
            HtmlNodeCollection headStyles = doc.DocumentNode.SelectNodes("/html/head/style");
            List<CSSRule> rules = new List<CSSRule>();
            foreach (HtmlNode styleNode in headStyles)
            {
                string cssRuleText = styleNode.InnerText;
                cssRuleText = cssRuleText.Replace("<!--", " ");
                cssRuleText = cssRuleText.Replace("-->", " ");
                cssRuleText = cssRuleText.Replace("\r\n", " ");
                rules.AddRange(CSSRule.ParseForRules(cssRuleText));
            }
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("<styles>");
            sb.AppendLine(@"<style id=""Normal"" type=""text/css"">");
            //foreach (CSSRule cr in fh.StyleRules.Where(x => !x.Selector.StartsWith("@")))
            foreach (CSSRule cr in rules)
            {
                sb.Append(cr.ToString());
            }
            sb.AppendLine("</style>");
            sb.AppendLine("</styles>");
            return sb.ToString();
        }
        private void AddClassNamesToLinks(HtmlNode contentDiv)
        {
            Func<string, string> extractId = (text) =>
                {
                    //string text = "page/58";
                    string pattern = @"[^0-9]+";
                    return Regex.Replace(text, pattern, "");
                };
            HtmlNodeCollection aNodes = contentDiv.SelectNodes("//a");
            if (aNodes != null)
            {
                foreach (HtmlNode anode in aNodes)
                {
                    if (anode.Attributes.Contains("href"))
                    {
                        string className = "link"; ;
                        string hrefValue = anode.Attributes["href"].Value;
                        //Log.Write("a tag with href {0} found", hrefValue);
                        string[] builtInUrls = new string[]
                            {
                                "/home", "/login", "/register", "/recoverpassword",
                                "/studio", "/membership"
                            };
                        if (builtInUrls.Contains(hrefValue))
                        {
                            className += " " + hrefValue.Substring(1) + "link";
                        }
                        else if (hrefValue.StartsWith("page") || hrefValue.StartsWith("/page"))
                        {
                            className += " pagelink" + string.Format(" page-{0}", extractId(hrefValue)); ;

                        }
                        else if (hrefValue.StartsWith("video") || hrefValue.StartsWith("/video"))
                        {
                            className += " videolink" + string.Format(" video-{0}", extractId(hrefValue)); ;

                        }
                        else if (hrefValue.StartsWith("document") || hrefValue.StartsWith("/document"))
                        {
                            className += " documentlink" + string.Format(" document-{0}", extractId(hrefValue)); ;
                        }

                        if (anode.Attributes.Contains("class"))
                        {
                            anode.Attributes["href"].Value = anode.Attributes["href"].Value + " " + className;
                        }
                        else
                        {
                            anode.Attributes.Add("class", className);
                        }
                    }

                }
            }
        }
        //private void EnsureRequiredPanels()
        //{
        //    Func<string, Panel, bool, int?, int?, Panel> createPanel = (name, parentPanel, visible, pixelHeight, pixelWidth) =>
        //        {
        //            Panel panel = new Panel();
        //            panel.ParentPanel = parentPanel;
        //            panel.Name = name;
        //            panel.Visible = visible;
        //            panel.LastModified = DateTime.UtcNow;

        //            panel.PixelHeight = pixelHeight;
        //            panel.PixelWidth = pixelWidth;
        //            panel.Style = new Style();
        //            ctx.Panels.Add(panel);
        //            ctx.Styles.Add(panel.Style);
        //            return panel;
        //        };
        //    bool panelsExist = ctx.Panels.SingleOrDefault(x => x.Name == "Root") != null;
        //    if (!panelsExist)
        //    {
        //        Panel rootPanel = createPanel("Root", null, true, null, null);
        //        Panel browserPanel = createPanel("BrowserPanel", rootPanel, true, null, null);
        //        //
        //        int leftPanelWidth = 210;
        //        int rightPanelWidth = 151;// but note that is not visible, so excluded from sitePanelWidth calculation
        //        int centrePanelWidth = 630;
        //        int sitePanelWidth = leftPanelWidth + centrePanelWidth; // to create a nonfluid centre
        //        Panel sitePanel = createPanel("SitePanel", browserPanel, true, null, sitePanelWidth);
        //        sitePanel.Style.Font = new Font();
        //        sitePanel.Style.Font.Name = "verdana";
        //        sitePanel.Style.Font.PointSize = 10.5;
        //        ctx.Fonts.Add(sitePanel.Style.Font);
        //        //
        //        Panel contentPanel = createPanel("ContentPanel", sitePanel, true, null, null);
        //        Panel bannerPanel = createPanel("BannerPanel", sitePanel, true, 90, null);
        //        //
        //        Panel menuPanel = createPanel("MenuPanel", sitePanel, true, 31, null);
        //        menuPanel.Style.Colour = "#ffffff";
        //        BorderedRectangle br = new BorderedRectangle();
        //        br.Bottom = new BorderInfo();
        //        br.Bottom.Color = "#bb006d";
        //        br.Bottom.Width = 3.0;
        //        br.Bottom.Style = BorderLineStyle.Solid;
        //        menuPanel.Style.Border = br.ToString();
        //        menuPanel.Style.Background = new Background();
        //        menuPanel.Style.Background.Colour = "#1b76bc"; // a kind of blue
        //        menuPanel.Visible = false;
        //        ctx.Backgrounds.Add(menuPanel.Style.Background);
        //        //
        //        Panel leftPanel = createPanel("LeftPanel", contentPanel, true, null, leftPanelWidth);
        //        Panel centrePanel = createPanel("CentrePanel", contentPanel, true, null, null); // width excluded as included within sitePanelWidth
        //        //
        //        Panel rightPanel = createPanel("RightPanel", contentPanel, true, null, rightPanelWidth);
        //        rightPanel.Visible = false;
        //        ctx.SaveChanges();
        //    }
        //}
        private void LoadLegacyData()
        {
            string configConnectionString = ApplicationSettings.Key<string>("LegacyDataConnection", null);
            Debug.Assert(!String.IsNullOrWhiteSpace(configConnectionString));
            //using (var scope = new TransactionScope())
            //{
            using (var tran = ctx.Database.BeginTransaction())
            {
                try
                {
                    using (LegacyLoader ll = new LegacyLoader(ctx, configConnectionString))
                    {
                        //ll.LoadClientApps();
                        //Log.Write("legacyData: ClientApps loaded");
                        //ll.LoadRoles();
                        //Log.Write("legacyData: Roles loaded");
                        //ll.LoadRegistrationKeys();
                        //Log.Write("legacyData: RegistrationKeys loaded");
                        ll.LoadGroups();
                        Log.Write("legacyData: Groups loaded");
                        ll.LoadMembers();
                        Log.Write("legacyData: Members loaded");
                        //ll.LoadAccessRules();
                        //Log.Write("legacyData: AccessRules loaded");
                        //ll.LoadBackgrounds();
                        //Log.Write("legacyData: Backgrounds loaded");
                        ll.LoadDirectories();
                        Log.Write("legacyData: Directories loaded");
                        ll.LoadDirectoryGroups();
                        Log.Write("legacyData: DirectoryAccessRules loaded");
                        //ll.LoadFonts();
                        //Log.Write("legacyData: Fonts loaded");
                        //ll.LoadStyles();
                        //Log.Write("legacyData: Styles loaded");
                        //ll.LoadPanels();
                        //Log.Write("legacyData: Panels loaded");
                        ll.LoadDocuments();
                        Log.Write("legacyData: Documents loaded");
                        ll.LoadPages();
                        Log.Write("legacyData: Pages loaded");
                        //ll.LoadPanelPages();
                        //Log.Write("legacyData: PanelPages loaded");
                        //ll.LoadPageAccessRules();
                        //Log.Write("legacyData: PageAccessRules loaded");
                        ll.LoadImages();
                        Log.Write("legacyData: Images loaded");
                        ll.LoadSiteSettings();
                        Log.Write("legacyData: SiteSettings loaded");
                        ll.LoadMenus();
                        Log.Write("legacyData: Menus loaded");
                    }
                    tran.Commit();
                }
                catch (Exception xe)
                {
                    tran.Rollback();
                    Log.Write(xe);
                    throw;
                }
            }
            //}
        }
        private bool IsDatabaseCompletelyEmpty()
        {
            int c1 = ctx.Members.Count();
            //int c2 = ctx.Roles.Count();
            int c3 = ctx.Groups.Count();
            return (c1 + c3) == 0;
        }
        //private void EnsureClientApplications()
        //{
        //    Action<string, bool, string> ensureApplication = (name, isInstalled, url) =>
        //    {
        //        if (ctx.ClientApps.SingleOrDefault(ca => ca.Name == name) == null)
        //        {
        //            ctx.ClientApps.Add(new ClientApp { Name = name, IsInstalled = isInstalled, Url = url, Timestamp = BitConverter.GetBytes(-1) });
        //        }
        //    };
        //    ensureApplication("Webframe Studio", true, "/studio");
        //    ensureApplication("Membership Manager", false, "/membership");
        //    ctx.SaveChanges();
        //}
        //private void EnsureRequiredRoles()
        //{
        //    //Action<string> ensureRole = (name) =>
        //    //{
        //    //    if (ctx.Roles.SingleOrDefault(x => x.Name == name) == null)
        //    //    {
        //    //        ctx.Roles.Add(new Role { Name = name });
        //    //        //Log.Debug("{0}: role {1} added", identifier, name);
        //    //    }
        //    //};
        //    //ensureRole(Roles.Administrator.ToString());
        //    //ctx.SaveChanges();
        //}
        private void EnsureRequiredGroups()
        {
            int weightIncrement = Group.GetWeightIncrement();
            Func<string, Group, Group> findGroup = (name, parent) =>
                {
                    if (parent == null)
                    {
                        return ctx.Groups.SingleOrDefault(x => x.Name == name && x.ParentGroup == null);
                    }
                    else
                    {
                        return ctx.Groups.SingleOrDefault(x => x.Name == name && x.ParentGroup.GroupId == parent.GroupId);
                    }
                };
            Func<SystemGroups, string, GroupTypes, Group, Group> addgroup = (group, descr, type, parent) =>
            {
                string name = group.ToString();
                Group g = findGroup(name, parent);
                if (g == null)
                {
                    int weight = parent == null ? 0 : parent.Weight + weightIncrement;
                    g = new Group { Name = name, Type = type, ParentGroup = parent, Description = descr, Weight = weight };
                    ctx.Groups.Add(g);
                    //Log.Debug("{0}: group {1} added", identifier, name);
                }
                else
                {
                    g.Description = descr;
                }
                return g;
            };

            Group everyone = addgroup(SystemGroups.Everyone, "All visitors whether members or not", GroupTypes.System | GroupTypes.SystemDefinedMembers, null);
            Group all = addgroup(SystemGroups.AllMembers, "All visitors that have logged in (and therefore are members)", GroupTypes.System | GroupTypes.SystemDefinedMembers, everyone);
            Group anon = addgroup(SystemGroups.Anonymous, "All visitors that have not logged in - this group excludes those that have logged in", GroupTypes.System | GroupTypes.SystemDefinedMembers, everyone);
            Group admins = addgroup(SystemGroups.Administrators, "Site Administrators - members who can do everything", GroupTypes.System, all);
            Group designers = addgroup(SystemGroups.Designers, "Site Designers - members who can modify layout and style", GroupTypes.System, all);
            Group editors = addgroup(SystemGroups.Editors, "Site Editors - members who can add, modify and delete pages and folders", GroupTypes.System, all);
            ctx.SaveChanges();
        }
        private void EnsureAdministratorInAdministratorsGroup()
        {
            var admingroup = ctx.Groups.ToArray().Single(x => x.Type.HasFlag(GroupTypes.System) && x.Name == SystemGroups.Administrators.ToString());
            var editorsGroup = ctx.Groups.ToArray().Single(x => x.Type.HasFlag(GroupTypes.System) && x.Name == SystemGroups.Editors.ToString());
            var designersGroup = ctx.Groups.ToArray().Single(x => x.Type.HasFlag(GroupTypes.System) && x.Name == SystemGroups.Designers.ToString());
            var adminMembers = admingroup.Members.ToList();
            var originalAdmin = ctx.Members.Single(x => x.IsAdministrator);
            if (!adminMembers.Contains(originalAdmin))
            {
                adminMembers.Add(originalAdmin);
            }
            if (!editorsGroup.Members.Contains(originalAdmin))
            {
                editorsGroup.Members.Add(originalAdmin);
            }
            if (!designersGroup.Members.Contains(originalAdmin))
            {
                designersGroup.Members.Add(originalAdmin);
            }
            //var editorsGroup = ctx.Groups.ToArray().Single(x => x.Type.HasFlag(GroupTypes.System) && x.Name == "Editors");
            //var designersGroup = ctx.Groups.ToArray().Single(x => x.Type.HasFlag(GroupTypes.System) && x.Name == "Designers");
            //foreach (Member m in adminMembers)
            //{
            //    if (!editorsGroup.Members.Contains(m))
            //    {
            //        editorsGroup.Members.Add(m);
            //    }
            //    if (!designersGroup.Members.Contains(m))
            //    {
            //        designersGroup.Members.Add(m);
            //    }
            //}
            ctx.SaveChanges();
        }
        private void SetSiteVersion(string version)
        {
            SiteSetting ss = ctx.SiteSettings.SingleOrDefault(x => x.Name == "Version");
            if (ss != null)
            {
                ss.Value = version;
            }
            else
            {
                ss = new SiteSetting { Name = "Version", Value = version };
                ctx.SiteSettings.Add(ss);
            }
            ctx.SaveChanges();
        }
        private void RequestCSSRewrite()
        {
            SiteSetting ss = new SiteSetting();
            ss.Name = "PanelCSSWriteRequest";
            ss.Value = "True";
            ctx.SiteSettings.Add(ss);
            ss = new SiteSetting();
            ss.Name = "MenuCSSWriteRequest";
            ss.Value = "True";
            ctx.SiteSettings.Add(ss);
            ctx.SaveChanges();
        }
        //public void CreateCSSFiles()
        //{
        //    var folder = CSSRule.GetAppCSSFolder();// HostingEnvironment.MapPath("~/Content/Main/AppCSS");
        //    string[] panelList = new string[] {
        //             "BrowserPanel",
        //             "SitePanel",
        //             "CentrePanel",
        //             "BannerPanel",
        //             "MenuPanel",
        //             "ContentPanel",
        //             "LeftPanel",
        //             "RightPanel"
        //    };
        //    foreach (var panel in panelList)
        //    {
        //        string cssText;
        //        switch (panel)
        //        {
        //            case "BrowserPanel":
        //                cssText = Panel.BrowserPanel.GetCSSString();
        //                break;
        //            case "SitePanel":
        //                cssText = Panel.SitePanel.GetCSSString();
        //                break;
        //            case "CentrePanel":
        //                cssText = Panel.CentrePanel.GetCSSString();
        //                break;
        //            case "BannerPanel":
        //                cssText = Panel.BannerPanel.GetCSSString();
        //                break;
        //            case "MenuPanel":
        //                cssText = Panel.MenuPanel.GetCSSString();
        //                break;
        //            case "ContentPanel":
        //                cssText = Panel.ContentPanel.GetCSSString();
        //                break;
        //            case "LeftPanel":
        //                cssText = Panel.LeftPanel.GetCSSString();
        //                break;
        //            case "RightPanel":
        //                cssText = Panel.RightPanel.GetCSSString();
        //                break;
        //            default:
        //                throw new ApplicationException("CreateCSSFiles(): unknown panel");
        //        }
        //        string cssFileName = System.IO.Path.Combine(folder, panel + ".css");
        //        System.IO.File.WriteAllText(cssFileName, cssText);
        //    }
        //    string menuCssText = Menu.GetCSSString();
        //    string menuCssFile = System.IO.Path.Combine(folder, "Menu.css");
        //    System.IO.File.WriteAllText(menuCssFile, menuCssText);
        //}
    }

    public class LegacyLoader : IDisposable
    {
        private CoreDataContext coreDb;
        private ApplicationDbContext appDb;
        private LDB.WebframeDataEntities legacyDb;
        private string configConnectionString;
        public LegacyLoader(CoreDataContext context, string configConnectionString)
        {
            coreDb = context;
            appDb = new ApplicationDbContext();
            this.configConnectionString = configConnectionString;
            string connectionString = GetEntityConnectionString(configConnectionString);
            legacyDb = new LDB.WebframeDataEntities(connectionString);
        }
        public void Dispose()
        {
            legacyDb.Dispose();
        }
        //internal void LoadAccessRules()
        //{
        //    foreach (var item in legacyDb.AccessRules)
        //    {
        //        AccessRule ar = new AccessRule { Permission = (Permission)item.PermissionCode, Allow = item.Allow };
        //        coreDb.AccessRules.Add(ar);
        //    }
        //    coreDb.SaveChanges();
        //}
        //internal void LoadBackgrounds()
        //{
        //    foreach (var item in legacyDb.Backgrounds)
        //    {
        //        Background bg = new Background { Colour = item.Colour, BackgroundImageUrl = item.BackgroundImageUrl, BackgroundPosition = item.BackgroundPosition, BackgroundRepeat = item.BackgroundRepeat };
        //        coreDb.Backgrounds.Add(bg);
        //    }
        //    coreDb.SaveChanges();
        //}
        //internal void LoadClientApps()
        //{
        //    foreach (var item in legacyDb.ClientApps)
        //    {
        //        ClientApp ca = new ClientApp { Name = item.Name, IsInstalled = item.IsInstalled, Url = item.Url };
        //        coreDb.ClientApps.Add(ca);
        //    }
        //    coreDb.SaveChanges();
        //}
        internal void LoadDirectories()
        {
            Action<LDB.Directory, Directory> addDirectory = null;
            addDirectory = (item, parent) =>
            {
                Directory g = new Directory { Name = item.Name, ParentDirectory = parent, Deleted = item.Deleted };
                coreDb.Directories.Add(g);
                foreach (var child in item.SubDirectories)
                {
                    addDirectory(child, g);
                }
            };
            foreach (var item in legacyDb.Directories.Where(g => g.ParentDirectory == null))
            {
                addDirectory(item, null);
            }
            coreDb.SaveChanges();
        }
        internal void LoadDirectoryGroups()
        {
            foreach (var item in legacyDb.DirectoryAccessRules)
            {
                Directory d = coreDb.Directories.ToArray().First(x => x.FullName == item.Directory.Fullpath);
                Group g = coreDb.Groups.ToArray().First(x => x.Fullpath == item.Group.Fullpath);
                DirectoryGroup dg = coreDb.DirectoryGroups.Local.SingleOrDefault(x => x.DirectoryId == d.DirectoryId && x.GroupId == g.GroupId);
                if (dg == null)
                {
                    dg = new DirectoryGroup { Directory = d, Group = g, Permission = Permission.ViewPages };
                    coreDb.DirectoryGroups.Add(dg);
                }
                //AccessRule ar = coreDb.AccessRules.First(x => ((int)x.Permission) == ((int)item.AccessRule.Permission) && x.Allow == item.AccessRule.Allow);
                //DirectoryAccessRule dar = new DirectoryAccessRule { Directory = d, Group = g, AccessRule = ar };
                //coreDb.DirectoryAccessRules.Add(dar);
            }
            coreDb.SaveChanges();
        }
        //internal void LoadPageAccessRules()
        //{
        //    foreach (var item in legacyDb.PageAccessRules)
        //    {
        //        Page p = coreDb.Pages.Find(item.Page.PageId);
        //        Group g = coreDb.Groups.ToArray().First(x => x.Fullpath == item.Group.Fullpath);
        //        AccessRule ar = coreDb.AccessRules.First(x => ((int)x.Permission) == ((int)item.AccessRule.Permission) && x.Allow == item.AccessRule.Allow);
        //        PageAccessRule par = new PageAccessRule { Page = p, Group = g, AccessRule = ar };
        //        coreDb.PageAccessRules.Add(par);
        //    }
        //    coreDb.SaveChanges();
        //}
        internal void LoadPages()
        {
            foreach (var item in legacyDb.Pages)
            {
                Directory d = coreDb.Directories.ToArray().First(x => x.FullName == item.Directory.Fullpath);
                Page p = new Page
                {
                    PageId = item.PageId,
                    Name = item.Name,
                    MarkupType = (MarkupType)item.MarkupTypeCode,
                    Type = PageType.Centre, // the default
                    Directory = d,
                    IsLandingPage = item.IsLandingPage,
                    InheritSideContentFromUrl = item.InheritSideContentFromUrl,
                    Visible = item.Visible,
                    Locked = item.Locked,
                    Deleted = item.Deleted
                };
                coreDb.Pages.Add(p);
                LDB.PageMarkup pm = item.PageMarkups.First();
                PageMarkup markup = new PageMarkup
                {
                    PageId = item.PageId,
                    CreatedOn = pm.CreatedOn,
                    CreatedBy = pm.CreatedBy,
                    Data = pm.Data,
                    MarkupLength = pm.MarkupLength,
                    HtmlText = pm.HtmlText,
                    HtmlTextLength = pm.HtmlTextLength ?? 0,
                    HtmlStyles = pm.HtmlStyles,
                    HtmlScripts = pm.HtmlScripts,
                    ThumbNail = pm.ThumbNail,
                    MiddleThumbNail = pm.MiddleThumbNail,
                    SmallThumbNail = pm.SmallThumbNail,
                };
                coreDb.PageMarkups.Add(markup);
            }
            // second pass to collect links
            foreach (var item in legacyDb.Pages)
            {
                foreach (var mpl in item.MarkupPageLinks)
                {
                    Page p = coreDb.Pages.Find(mpl.PageMarkup.Page.PageId);
                    Page linkedTo = coreDb.Pages.Find(mpl.Page.PageId);
                    p.ForwardLinks.Add(linkedTo);
                }
                foreach (var mdl in item.PageMarkups.First().MarkupDocumentLinks)
                {
                    Page p = coreDb.Pages.Find(mdl.PageMarkup.Page.PageId);
                    Document d = coreDb.Documents.Find(mdl.Document.DocumentId);
                    p.Documents.Add(d);
                }
            }
            coreDb.SaveChanges();
        }
        internal void LoadDocuments()
        {
            foreach (var item in legacyDb.Documents)
            {
                Directory d = coreDb.Directories.ToArray().First(x => x.FullName == item.Directory.Fullpath);
                Document doc = new Document
                {
                    DocumentId = item.DocumentId,
                    Directory = d,
                    Name = item.Name,
                    Extension = item.Extension,
                    CreatedOn = item.CreatedOn,
                    CreatedBy = item.CreatedBy,
                    //Type = (DocumentType)item.Type,
                    Visible = item.Visible,
                    Deleted = item.Deleted,
                    Data = item.Data
                };
                coreDb.Documents.Add(doc);
            }
            coreDb.SaveChanges();
        }
        //internal void LoadFonts()
        //{
        //    foreach (var item in legacyDb.Fonts)
        //    {
        //        Font f = new Font { Name = item.Name, PointSize = item.PointSize, Style = item.Style, Weight = item.Weight };
        //        coreDb.Fonts.Add(f);
        //    }
        //    coreDb.SaveChanges();
        //}
        internal void LoadRoles()
        {
            //foreach (var item in wde.Roles)
            //{
            //    Role r = new Role { Name = item.Name };
            //    ctx.Roles.Add(r);
            //}
            //ctx.SaveChanges();
        }
        internal void LoadGroups()
        {
            int weightIncrement = Group.GetWeightIncrement();
            Action<LDB.Group, Group> addGroup = null;
            addGroup = (item, parent) =>
            {
                int weight = parent == null ? 0 : parent.Weight + weightIncrement;
                Group g = new Group { Name = item.Name, ParentGroup = parent, Description = item.Description, Weight = weight, Type = (GroupTypes)(int)item.Type };
                coreDb.Groups.Add(g);
                foreach (var child in item.Children)
                {
                    addGroup(child, g);
                }
            };
            foreach (var item in legacyDb.Groups.Where(g => g.ParentGroup == null))
            {
                addGroup(item, null);
            }
            coreDb.SaveChanges();
        }
        //internal void LoadPanels()
        //{
        //    Action<LDB.Panel, Panel> addPanel = null;
        //    addPanel = (item, parent) =>
        //    {
        //        Style style = FindStyle(item.Style);
        //        Panel panel = new Panel
        //        {
        //            Name = item.Name,
        //            ParentPanel = parent,
        //            Visible = item.Visible,
        //            LastModified = item.LastModified,
        //            PixelHeight = item.PixelHeight,
        //            PixelWidth = item.PixelWidth,
        //            Style = style,
        //        };
        //        coreDb.Panels.Add(panel);
        //        foreach (var child in item.ChildPanels)
        //        {
        //            addPanel(child, panel);
        //        }
        //    };
        //    foreach (var item in legacyDb.Panels.Where(g => g.ParentPanel == null))
        //    {
        //        addPanel(item, null);
        //    }
        //    coreDb.SaveChanges();
        //}
        //internal void LoadPanelPages()
        //{
        //    foreach (var item in legacyDb.PanelPages)
        //    {
        //        Panel panel = coreDb.Panels.Single(x => x.Name == item.Panel.Name);
        //        Page cp = coreDb.Pages.Find(item.CentrePage.PageId);
        //        Page p = coreDb.Pages.Find(item.Page.PageId);
        //        switch (item.Panel.Name)
        //        {
        //            case "BannerPanel":
        //                p.Type = PageType.Banner;
        //                break;
        //            case "LeftPanel":
        //                p.Type = PageType.Left;
        //                break;
        //            case "RightPanel":
        //                p.Type = PageType.Right;
        //                break;
        //        }
        //        //PanelPage r = new PanelPage { Panel = panel, Page = p, CentrePage = cp };
        //        //coreDb.PanelPages.Add(r);
        //    }
        //    coreDb.SaveChanges();
        //}
        //internal void LoadStyles()
        //{
        //    foreach (var item in legacyDb.Styles)
        //    {
        //        Background b = FindBackground(item.Background);
        //        Font font = FindFont(item.Font);
        //        Style style = new Style
        //        {
        //            Font = font,
        //            Background = b,
        //            Border = item.Border,
        //            Margin = item.Margin,
        //            Padding = item.Padding,
        //            Colour = item.Colour,
        //            TextAlignment = item.TextAlignment,
        //            VerticalAlignment = item.VerticalAlignment,
        //            OriginalStyleId = item.StyleId
        //        };
        //        coreDb.Styles.Add(style);
        //    }
        //    coreDb.SaveChanges();
        //}
        internal void LoadMembers()
        {
            bool visiblePassword = ApplicationSettings.Key("VisiblePassword", false) || ApplicationSettings.Key("Membership:EditablePassword", false);// SiteSetting.Get("VisiblePassword", false);
            using (var tran = appDb.Database.BeginTransaction(System.Data.IsolationLevel.ReadCommitted))
            {
                try
                {
                    foreach (var item in legacyDb.Members.OrderBy(x => x.UserId))
                    {
                        if (item.Name == "Administrator$")
                        {
                            continue;
                        }
                        var user = new ApplicationUser
                        {
                            Id = Guid.NewGuid().ToString(),
                            Email = item.Email,
                            UserName = item.Email,
                        };
                        Member m = new Member
                        {
                            Id = user.Id,
                            //UserName = item.Email,
                            EmailAddress = item.Email,
                            EmailAddressConfirmed = true,
                            FirstName = item.FirstName,
                            LastName = item.LastName,
                            CreationDate = item.CreationDate,
                            LastLoginDate = item.LastLoginDate < item.CreationDate ? item.CreationDate : item.LastLoginDate,
                            Disabled = !item.Active,
                            //Disabled = item.Active,
                            //EmailValidated = item.EmailValidated,
                            //EmailValidationKey = item.EmailValidationKey,
                            //PasswordIsRecoverable = item.PasswordIsRecoverable
                        };
                        if (item.Name == "Administrator")
                        {
                            m.FirstName = "";
                            m.LastName = "Administrator";
                            m.IsAdministrator = true;
                        }
                        coreDb.Members.Add(m);
                        //Debug.Print("{0} ...", m.Name);

                        MembershipProvider mp = Membership.Providers["LegacySqlMembershipProvider"];
                        MembershipUser mu = mp.GetUser(item.Name, false);
                        if (mu.IsLockedOut)
                        {
                            mu.UnlockUser();
                        }
                        string password = mu.GetPassword();
                        if (visiblePassword)
                        {
                            m.PlainPassword = password;
                        }
                        user.PasswordHash = Member.HashPassword(password);
                        user.SecurityStamp = Guid.NewGuid().ToString();
                        appDb.Users.Add(user);
                        foreach (var gm in item.GroupMembers)
                        {
                            LDB.Group group = gm.Group;
                            var ng = coreDb.Groups.FirstOrDefault(x => x.Name == group.Name);
                            if (ng != null)
                            {
                                m.Groups.Add(ng);
                            }
                        }
                    }
                    appDb.SaveChanges();
                    tran.Commit();
                }
                catch (Exception xe)
                {
                    tran.Rollback();
                    Log.Write(xe);
                }
            }
            //ctx.SaveChanges();
        }
        internal void LoadSiteSettings()
        {
            foreach (var item in legacyDb.SiteSettings)
            {
                SiteSetting ss = new SiteSetting { Name = item.Name, Value = item.Value };
                if (ss.Name == "OnLineBookingClosed")
                {
                    ss.Value = "False";
                    coreDb.SiteSettings.Add(ss);
                }
            }
            coreDb.SaveChanges();
        }
        internal void LoadImages()
        {
            Func<Image, string> createName = (t) =>
            {
                string ext = string.Empty;
                switch (t.ImageType)
                {
                    case ImageType.Gif:
                        ext = ".gif";
                        break;
                    default:
                    case ImageType.Jpeg:
                        ext = ".jpg";
                        break;
                    case ImageType.Png:
                        ext = ".png";
                        break;
                }
                return string.Format("image-{0}{1}", t.ImageId, ext);
            };
            foreach (Page p in coreDb.Pages)
            {
                HtmlDocument doc = new HtmlDocument();
                doc.LoadHtml(p.PageMarkup.HtmlText);
                bool hasChanges = false;
                HtmlNodeCollection imgNodes = doc.DocumentNode.SelectNodes("//img");
                if (imgNodes != null)
                {
                    foreach (HtmlNode imgNode in imgNodes)
                    {
                        if (imgNode.Attributes.Contains("src"))
                        {
                            string srcValue = imgNode.Attributes["src"].Value.ToLower();
                            if (srcValue.StartsWith("/"))
                            {
                                srcValue = srcValue.Substring(1);
                            }
                            if (srcValue.StartsWith("image/"))
                            {
                                long pk = Convert.ToInt64(srcValue.Substring(6));
                                LDB.TopicImage ti = legacyDb.TopicImages.SingleOrDefault(x => x.TopicImageId == pk);
                                Image image = coreDb.CreateNewImage();
                                image.CreatedBy = p.CreatedBy;
                                image.CreatedOn = p.CreatedOn;
                                image.Data = ti.ImageData;
                                image.Directory = p.Directory;
                                image.Height = ti.Height;
                                image.ImageType = (ImageType)(int)ti.ImageType;
                                image.Width = ti.Width;
                                image.TimeStamp = BitConverter.GetBytes(-1);
                                image.Name = createName(image);
                                coreDb.Images.Add(image);
                                pk = image.ImageId;
                                imgNode.Attributes["src"].Value = string.Format("image/{0}", pk);
                                hasChanges = true;
                            }
                        }
                    }
                    if (hasChanges)
                    {
                        var sw = new System.IO.StringWriter();
                        doc.Save(sw);
                        p.PageMarkup.HtmlText = sw.ToString();
                        p.PageMarkup.HtmlTextLength = p.PageMarkup.HtmlText.Length;
                    }
                }
            }
            //foreach (var item in wde.TopicImages)
            //{
            //    ImageInformation image = new ImageInformation
            //    {
            //        ImageInformationId = item.TopicImageId,
            //        Height = item.Height,
            //        Image = item.Image,
            //        Width = item.Width,
            //        ImageType = (ImageType)item.ImageTypeCode
            //    };
            //    coreDb.ImageInformata.Add(image);
            //}
            coreDb.SaveChanges();
        }
        internal void LoadMenus()
        {
            Func<LDB.Menu, Menu, Menu> addMenu = null;
            addMenu = (item, parent) =>
            {
                Page p = item.Page == null ? null : coreDb.Pages.Find(item.Page.PageId);
                Menu menu = new Menu
                {
                    ParentMenu = parent,
                    Text = item.Text,
                    Page = p,
                    Index = item.Sequence,
                    Url = item.Url,                    
                };
                coreDb.Menus.Add(menu);
                foreach (var child in item.SubMenus)
                {
                    addMenu(child, menu);
                }
                return menu;
            };
            MenuMaster mm = new MenuMaster
            {
                Name = "main-menu",
                PanelName = PanelNames.MenuPanel,
                IsDisabled = false
            };
            foreach (var item in legacyDb.Menus.Where(g => g.ParentMenu == null))
            {
                mm.Menus.Add( addMenu(item, null));
            }
            coreDb.MenuMasters.Add(mm);
            coreDb.SaveChanges();
        }
        //internal void LoadMenusOld()
        //{
        //    Action<LDB.Menu, Menu> addMenu = null;
        //    addMenu = (item, parent) =>
        //    {
        //        Page p = item.Page == null ? null : coreDb.Pages.Find(item.Page.PageId);
        //        Style normalStyle = FindStyle(item.NormalStyle);
        //        Style hoverStyle = FindStyle(item.HoverStyle);
        //        Style selectedStyle = FindStyle(item.SelectedStyle);
        //        Menu menu = new Menu
        //        {
        //            ParentMenu = parent,
        //            Sequence = item.Sequence,
        //            Text = item.Text,
        //            AccessibilityCode = item.AccessibilityCode,
        //            Page = p,
        //            Url = item.Url,
        //            Visible = item.Visible,
        //            LastModified = item.LastModified,
        //            PixelHeight = item.PixelHeight,
        //            PixelWidth = item.PixelWidth,
        //            SubMenuPixelHeight = item.SubMenuPixelHeight,
        //            SubMenuPixelWidth = item.SubMenuPixelWidth,
        //            InheritParentStyles = item.InheritParentStyles,
        //            NormalStyle = normalStyle,
        //            HoverStyle = hoverStyle,
        //            SelectedStyle = selectedStyle,
        //            UseStandardArrows = item.UseStandardArrows,
        //            NormalArrowColour = item.NormalArrowColour,
        //            HighlitArrowColour = item.HighlitArrowColour
        //        };
        //        coreDb.Menus.Add(menu);
        //        foreach (var child in item.SubMenus)
        //        {
        //            addMenu(child, menu);
        //        }
        //    };
        //    foreach (var item in legacyDb.Menus.Where(g => g.ParentMenu == null))
        //    {
        //        addMenu(item, null);
        //    }
        //    coreDb.SaveChanges();
        //}

        //private Style FindStyle(LDB.Style ls)
        //{
        //    return ls == null ? null : coreDb.Styles.Single(s => s.OriginalStyleId == ls.StyleId);
        //    //Font f = FindFont(ls.Font);
        //    //Background b = FindBackground(ls.Background);
        //    //Func<Style, bool> isMatch = (s) =>
        //    //    {
        //    //        bool result = (f == null && s.Font == null || (s.Font != null && f != null && s.Font.FontId == f.FontId))
        //    //            && (b == null && s.Background == null ||(s.Background != null && b != null) && s.Background.BackgroundId == b.BackgroundId)
        //    //            && s.Border == ls.Border && s.Margin == ls.Margin && s.Padding == ls.Padding && s.Colour == ls.Colour
        //    //            && s.TextAlignment == ls.TextAlignment && s.VerticalAlignment == ls.VerticalAlignment;
        //    //        return result;
        //    //    };
        //    //return ctx.Styles.AsEnumerable().First(x => isMatch(x));
        //}
        //private Font FindFont(LDB.Font font)
        //{
        //    if (font == null)
        //    {
        //        return null;
        //    }
        //    return FindFont(font.Name, font.PointSize, font.Style, font.Weight);
        //}
        //private Font FindFont(string name, double? pointsize, string style, string weight)
        //{
        //    return coreDb.Fonts.First(f => f.Name == name && f.PointSize == pointsize && f.Style == style && f.Weight == weight);
        //}
        //private Background FindBackground(LDB.Background background)
        //{
        //    if (background == null)
        //    {
        //        return null;
        //    }
        //    return FindBackground(background.Colour, background.BackgroundImageUrl, background.BackgroundPosition, background.BackgroundRepeat);
        //}
        //private Background FindBackground(string colour, string imageUrl, string position, string repeat)
        //{
        //    return coreDb.Backgrounds.First(b => b.Colour == colour && b.BackgroundImageUrl == imageUrl && b.BackgroundPosition == position && b.BackgroundRepeat == repeat);
        //}
        private string GetEntityConnectionString(string cs)
        {
            string sqlConnectionString = ConfigurationManager.ConnectionStrings[cs].ConnectionString;
            SqlConnectionStringBuilder cb = new SqlConnectionStringBuilder(sqlConnectionString);
            cb.MultipleActiveResultSets = true;
            cb.ApplicationName = "Webframe";
            sqlConnectionString = cb.ToString();
            // metadata=res://*/WebframeDataModel.csdl|res://*/WebframeDataModel.ssdl|res://*/WebframeDataModel.msl
            EntityConnectionStringBuilder ecb = new EntityConnectionStringBuilder();
            ecb.Provider = "System.Data.SqlClient";
            ecb.ProviderConnectionString = sqlConnectionString;
            ecb.Metadata = @"res://*/WebframeDataModel.csdl|res://*/WebframeDataModel.ssdl|res://*/WebframeDataModel.msl";
            return ecb.ToString();
        }
    }
}