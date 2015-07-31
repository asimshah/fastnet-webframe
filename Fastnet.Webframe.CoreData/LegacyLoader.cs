using Fastnet.Common;
using Fastnet.EventSystem;

using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Security;
using LDB = Fastnet.Webframe.Web.DataModel;

namespace Fastnet.Webframe.CoreData
{

    public class LegacyLoader : IDisposable
    {
        private CoreDataContext coreDb;
        private ApplicationDbContext appDb;
        private LDB.WebframeDataEntities legacyDb;
        //private string configConnectionString;
        public LegacyLoader(CoreDataContext context, LoaderFactory lf)
        {
            //LoaderFactory lf = new LoaderFactory();
            string configConnectionString = lf.LegacyConnectionString;
            coreDb = context;
            appDb = new ApplicationDbContext();
            //this.configConnectionString = configConnectionString;
            string connectionString = GetEntityConnectionString(configConnectionString);
            legacyDb = new LDB.WebframeDataEntities(connectionString);
        }
        public void Load()
        {
            using (var tran = coreDb.Database.BeginTransaction())
            {
                try
                {
                    LoadGroups();
                    Log.Write("legacyData: Groups loaded");
                    LoadMembers();
                    Log.Write("legacyData: Members loaded");
                    LoadDirectories();
                    Log.Write("legacyData: Directories loaded");
                    LoadDirectoryGroups();
                    Log.Write("legacyData: DirectoryAccessRules loaded");
                    LoadDocuments();
                    Log.Write("legacyData: Documents loaded");
                    LoadPages();
                    Log.Write("legacyData: Pages loaded");
                    LoadImages();
                    Log.Write("legacyData: Images loaded");
                    LoadSiteSettings();
                    Log.Write("legacyData: SiteSettings loaded");
                    LoadMenus();
                    Log.Write("legacyData: Menus loaded");
                    tran.Commit();
                }
                catch (Exception xe)
                {
                    tran.Rollback();
                    Log.Write(xe);
                    throw;
                }
            }
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
                    //InheritSideContentFromUrl = item.InheritSideContentFromUrl,
                    //Visible = item.Visible,
                    //Locked = item.Locked,
                    //Deleted = item.Deleted
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
                        DWHMember m = new DWHMember
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
                            DateOfBirth = null,// DateTime.MinValue,
                            BMCMembership = null, //"(missing)"
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
                                image.ImageType = (ImageType)ti.ImageTypeCode;
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
                Name = "DwhMenu",
                ClassName = "default-menu",
                PanelName = PanelNames.MenuPanel,
                IsDisabled = false
            };
            LDB.Menu rootMenu = legacyDb.Menus.Single(g => g.ParentMenu == null);
            // we don't use the old style single root menu anymore
            foreach (var item in rootMenu.SubMenus)
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
