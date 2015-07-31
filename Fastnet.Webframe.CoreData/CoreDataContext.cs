﻿using Fastnet.Common;
using Fastnet.Web.Common;
using Fastnet.EventSystem;
using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
//using System.Data.EntityClient;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Hosting;

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

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
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
    public class LoaderFactory : CustomFactory
    {
        public string LegacyConnectionString { get; set; }
        public bool DataLoad { get; set; }
        public LoaderFactory()
        {
            if (FactoryName != FactoryName.None)
            {
                LegacyConnectionString = GetLegacyConnectionString();
                DataLoad = Settings.legacy?.dataload ?? false;
            }
            else
            {
                DataLoad = false;
            }
        }
        private string GetLegacyConnectionString()
        {
            try
            {
                if (FactoryName == FactoryName.DonWhillansHut)
                {
                    string cs = Settings.legacy.connectionStringName;
                    if (string.IsNullOrWhiteSpace(cs))
                    {
                        throw new ApplicationException("No legacy connection string defined");
                    }
                    else
                    {
                        return cs;
                    }
                }
                else
                {
                    throw new ApplicationException("data load not supported for this factory");
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }
    }
    public class DataSeeder
    {
        //private bool dataload;
        //private string legacyConnectionString;
        private CoreDataContext ctx;
        public DataSeeder(CoreDataContext context)
        {
            ctx = context;
        }
        public void Seed()
        {
            LoaderFactory lf = new LoaderFactory();

            bool isEmpty = IsDatabaseCompletelyEmpty();
            //if (isEmpty && ApplicationSettings.Key("LegacyDataLoad", false))
            if (isEmpty && lf.DataLoad)
            {
                LegacyLoader ll = new LegacyLoader(ctx, lf);
                ll.Load();
                //LoadLegacyData();
                //CreateDefaultMenu(true); // create the default menu but disable it
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
                CreateLeftSidePanelMenu();
                SetSiteVersion("4.0.0.0");
                //// this will need addtion in cases of a v4 upgrade
                //WriteMainStylesheets();
                ////ClearCustomStylesheets();
            }
            EnsureAnonymousMember();
            EnsureRootDirectoryRestrictions();
        }

        //private void SetCustomisation()
        //{
        //    try
        //    {
        //        //var customisationFile = HostingEnvironment.MapPath("~/customisation.json");
        //        //string text = System.IO.File.ReadAllText(customisationFile);
        //        //dynamic customisation = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(text);
        //        dynamic customisation = Customisation.GetSettings();
        //        dataload = customisation.legacy?.dataload ?? false;
        //        if (dataload)
        //        {
        //            legacyConnectionString = customisation.legacy.connectionStringName;
        //        }
        //    }
        //    catch (Exception xe)
        //    {
        //        Log.Write(xe);
        //        throw;
        //    }
        //}

        private void CreateLeftSidePanelMenu(bool disable = false)
        {
            Menu designer = new Menu { Text = "Designer", Index = 0, Url = "designer" };
            ctx.Menus.Add(designer);

            Menu membership = new Menu { Text = "Membership", Index = 1, Url = "membership" };
            ctx.Menus.Add(membership);
            Menu reports = new Menu { Text = "Reports", Index = 2 };
            {
                Menu sc = new Menu { Text = "Site Content", ParentMenu = reports, Index = 0, Url = "cms/report/site-content" };
                ctx.Menus.Add(sc);
                Menu ml = new Menu { Text = "Member List", ParentMenu = reports, Index = 0, Url = "cms/report/member-list" };
                ctx.Menus.Add(ml);
                //Menu designer = new Menu { Text = "Designer", ParentMenu = apps, Index = 1, Url = "designer" };
                //ctx.Menus.Add(designer);
                //Menu membership = new Menu { Text = "Membership", ParentMenu = apps, Index = 2, Url = "membership" };
                //ctx.Menus.Add(membership);
            }
            ctx.Menus.Add(reports);
            Directory root = ctx.Directories.Single(x => x.ParentDirectory == null);
           
            MenuMaster mm = new MenuMaster
            {
                Name = "SideMenu",
                ClassName = "default-menu",
                PanelName = PanelNames.None, // panel will be dtermined by the attached page
                IsDisabled = disable,
            };
            mm.Menus.Add(designer);
            mm.Menus.Add(membership);
            mm.Menus.Add(reports);
            //mm.Menus.Add(logout);
            Page leftPage = root.Pages.Single(x => x.Type == PageType.Left);
            //leftPage.PageMenu = mm;
            leftPage.MenuMasters.Add(mm);
            ctx.MenuMasters.Add(mm);
            ctx.SaveChanges();
        }       
        private void CreateDefaultMenu(bool disable = false)
        {
            Menu home = new Menu { Text = "Home", Index = 0, Url = "home" };
            ctx.Menus.Add(home);
            Menu apps = new Menu { Text = "Apps", Index = 1 };
            {
                Menu cms = new Menu { Text = "CMS", ParentMenu = apps, Index = 0, Url = "cms" };
                ctx.Menus.Add(cms);
                Menu designer = new Menu { Text = "Designer", ParentMenu = apps, Index = 1, Url = "designer" };
                ctx.Menus.Add(designer);
                Menu membership = new Menu { Text = "Membership", ParentMenu = apps, Index = 2, Url = "membership" };
                ctx.Menus.Add(membership);
            }
            ctx.Menus.Add(apps);
            Menu login = new Menu { Text = "Login", Index = 2, Url = "login" };
            ctx.Menus.Add(login);
            Menu logout = new Menu { Text = "Logout", Index = 4, Url = "logout" };
            ctx.Menus.Add(logout);
            //
            MenuMaster mm = new MenuMaster
            {
                Name = "MainMenu",
                ClassName = "default-menu",
                PanelName = PanelNames.MenuPanel,
                IsDisabled = disable
            };
            mm.Menus.Add(home);
            mm.Menus.Add(apps);
            mm.Menus.Add(login);
            mm.Menus.Add(logout);
            ctx.MenuMasters.Add(mm);
            ctx.SaveChanges();
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
            var anonymous = ctx.Members.OfType<Member>().SingleOrDefault(x => x.IsAnonymous);
            if (anonymous == null)
            {
                anonymous = new Member
                {
                    Id = "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz", // this can never be a legitimate guid
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
        private Page AddInitialPages(Directory directory)
        {
            Page bannerPage = AddHtmlPage(directory, "Banner.html", PageType.Banner);
            Page homePage = AddHtmlPage(directory, "Home Page.html", PageType.Centre);
            homePage.IsLandingPage = true;
            Page leftPage = AddHtmlPage(directory, "Left side panel.html", PageType.Left);// AddPage(directory, "Left side panel.docx");
            ctx.SaveChanges();
            return homePage;
        }
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
                //page.Visible = true;
                //page.VersionCount = 0;
                //page.Locked = true;
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
                //page.Visible = true;
                //page.VersionCount = 0;
                //page.Locked = true;
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
        private void LoadLegacyData()
        {

        }
        private bool IsDatabaseCompletelyEmpty()
        {
            int c1 = ctx.Members.Count();
            //int c2 = ctx.Roles.Count();
            int c3 = ctx.Groups.Count();
            return (c1 + c3) == 0;
        }
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
            
            MemberBase originalAdmin = ctx.Members.Single(x => x.IsAdministrator);
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
    }
}