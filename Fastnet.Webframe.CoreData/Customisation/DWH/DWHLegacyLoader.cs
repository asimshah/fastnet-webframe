﻿using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Webframe.BookingData;
using Fastnet.Webframe.CoreData.DWH;
using HtmlAgilityPack;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Transactions;
using System.Web.Security;
using LDB = Fastnet.Webframe.Web.DataModel;

namespace Fastnet.Webframe.CoreData
{
    public class DWHLegacyLoader : LoaderFactory //: IDisposable
    {
        private ApplicationDbContext appDb;
        private LDB.WebframeDataEntities legacyDb;
        private DWHLegacyBookingDbContext legacyBookingData;
        private string defaultMemberPassword;
        public DWHLegacyLoader(CoreDataContext context) : base(context)
        {
            defaultMemberPassword = Settings.legacy.defaultMemberPassword;
            //LoaderFactory lf = new LoaderFactory();
            string configConnectionString = GetLegacyConnectionString();
            //coreDb = context;
            appDb = new ApplicationDbContext();
            //this.configConnectionString = configConnectionString;
            string connectionString = GetEntityConnectionString(configConnectionString);
            legacyDb = new LDB.WebframeDataEntities(connectionString);
            string bookingConnectionString = GetLegacyBookingConnectionString();
            legacyBookingData = new DWHLegacyBookingDbContext(bookingConnectionString);
        }
        public override void Load()
        {
            // using (var tran = coreDb.Database.BeginTransaction())
            //using (TransactionScope tran = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            //{
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

                    CreateMembersFromVisitors();
                    //LoadBookings();
                    //tran.Complete();
                    LoadBookingData();
                }
                catch (Exception xe)
                {
                    //tran.Rollback();
                    Log.Write(xe);
                    throw;
                }
            }
            //}
        }
        public override void Dispose()
        {
            legacyDb.Dispose();
            legacyBookingData.Dispose();
        }
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
        internal void LoadMembers()
        {
            try
            {
                foreach (var item in legacyDb.Members.OrderBy(x => x.UserId))
                {
                    if (item.Name == "Administrator$")
                    {
                        continue;
                    }
                    MembershipProvider mp = Membership.Providers["LegacySqlMembershipProvider"];
                    MembershipUser mu = mp.GetUser(item.Name, false);
                    if (mu.IsLockedOut)
                    {
                        mu.UnlockUser();
                    }
                    string password = mu.GetPassword();
                    string email = item.Email.ToLower();
                    string firstName = item.FirstName;
                    string lastName = item.LastName;
                    if (item.Name == "Administrator")
                    {
                        firstName = "";
                        lastName = "Administrator";
                    }
                    DateTime creationDate = item.CreationDate;
                    DateTime? lastLoginDate = item.LastLoginDate < item.CreationDate ? item.CreationDate : item.LastLoginDate;
                    bool disabled = !item.Active;
                    //CreateMember(item);
                    DWHMember m = CreateMember(email, password, firstName, lastName, creationDate, lastLoginDate, disabled);
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
                //tran.Complete();
            }
            catch (Exception xe)
            {
                //tran.Rollback();
                Log.Write(xe);
            }
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
                mm.Menus.Add(addMenu(item, null));
            }
            coreDb.MenuMasters.Add(mm);
            coreDb.SaveChanges();
        }
        internal async void CreateMembersFromVisitors()
        {
            Dictionary<string, List<dynamic>> candidates = new Dictionary<string, List<dynamic>>();
            Action<string, dynamic> addCandidate = (email, details) =>
            {
                if (!candidates.ContainsKey(email))
                {
                    candidates.Add(email, new List<dynamic>());
                }
                candidates[email].Add(details);
            };
            Func<string, string> parseBMCNumber = (bn) =>
            {
                bn = bn.Trim();
                if (bn.Length == 7)
                {
                    bn = bn.ToUpper();
                    string pattern = @"^[A-Z][0-9]+$";
                    bool result = Regex.IsMatch(bn, pattern);
                    return result ? bn : null;
                }
                return null;
            };
            Func<string, string> capitalise = (name) =>
            {
                name = name.Trim().ToLower();
                name = name.Substring(0, 1).ToUpper() + name.Substring(1);
                return name;
            };
            var forwardBookings = legacyBookingData.Bookings.Where(b => b.To > DateTime.Today);
            var visitors = forwardBookings.Select(b => b.Visitor);

            foreach (var v in visitors)
            {
                //Debug.Print("legacy booking visitor: {0}, club/membership: {1}", v.Email, v.AssociationReference);
                string email = v.Email.ToLower();
                string firstName = capitalise(v.FirstName);
                string lastName = capitalise(v.LastName);
                string bmcNumber = parseBMCNumber(v.AssociationReference);
                string club = bmcNumber == null && v.AssociationReference != null ? v.AssociationReference : null;
                string phoneNumber = v.MobilePhone.Trim();

                addCandidate(email, new { firstName = firstName, lastName = lastName, bmcNumber = bmcNumber, phoneNumber = phoneNumber, club = club });
                //Debug.Print("{5}: {0}, {1}, {2}, {3}, {4}", email, firstName, lastName, bmcNumber, phoneNumber, count);
            }
            await CreateMembersFromCandidates(candidates);
            coreDb.SaveChanges();
        }
        private async Task CreateMembersFromCandidates(Dictionary<string, List<dynamic>> candidates)
        {
            DWHMemberFactory mf = MemberFactory.GetInstance() as DWHMemberFactory;
            foreach (KeyValuePair<string, List<dynamic>> kvp in candidates)
            {
                //++count;
                //Debug.Print("{0}: {1}", count, kvp.Key);
                BMCMembershipStatus status = BMCMembershipStatus.Unknown;
                var bestDetail = kvp.Value.FirstOrDefault(z => z.bmcNumber != null);
                if (bestDetail == null)
                {
                    bestDetail = kvp.Value.First();
                }
                string bmcNumber = bestDetail.bmcNumber ?? null;
                DateTime? expiry = null;
                //good++;
                if (bmcNumber != null && mf.EnableBMCApi)
                {
                    dynamic result = await mf.ValidateBMCNumber((string)bestDetail.bmcNumber, (string)bestDetail.lastName);
                    status = result.Status;
                    if (status == BMCMembershipStatus.Current || status == BMCMembershipStatus.Expired)
                    {
                        expiry = result.Expiry;
                    }
                }
                else if (bmcNumber == null)
                {
                    status = BMCMembershipStatus.Missing;
                }
                //Debug.Print("{2}: validate: {0}, {1}, ***** {3}", (string)x.lastName, (string)x.bmcNumber, good, status.ToString());
                //Debugger.Break();
                string email = kvp.Key;
                bool newlyCreated = false;
                DWHMember member = coreDb.Members.OfType<DWHMember>().SingleOrDefault(m => m.EmailAddress == email);
                if (member == null)
                {
                    member = CreateMember(email, defaultMemberPassword, (string)bestDetail.firstName, (string)bestDetail.lastName, DateTime.Today, null, false);
                    Group.AllMembers.Members.Add(member);
                    member.PlainPassword = defaultMemberPassword;
                    newlyCreated = true;
                    //Log.Write("Member created: {0}, {1}, {2}, bmc membership status: {3}", member.EmailAddress, member.Fullname, member.BMCMembership ?? "No BMC Membership number", status.ToString());
                }
                member.BMCMembership = bmcNumber;
                member.BMCMembershipExpiresOn = expiry;
                member.Organisation = bestDetail.club;
                member.PhoneNumber = bestDetail.phoneNumber;
                if (newlyCreated)
                {
                    Log.Write("Member created: {0}, {1}, {2}, bmc membership status: {3}", member.EmailAddress, member.Fullname, member.BMCMembership ?? "**No BMC Membership number**", status.ToString());
                }
            }
        }
        private DWHMember CreateMember(string email, string password, string firstName, string lastName,
            DateTime creationDate, DateTime? lastLoginDate, bool disabled)
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid().ToString(),
                Email = email,// item.Email.ToLower(),
                UserName = email, //item.Email.ToLower(),
                PasswordHash = Member.HashPassword(password),
                SecurityStamp = Guid.NewGuid().ToString()
            };
            appDb.Users.Add(user);
            appDb.SaveChanges();
            DWHMember m = new DWHMember
            {
                Id = user.Id,
                EmailAddress = email,//item.Email.ToLower(),
                EmailAddressConfirmed = true,
                FirstName = firstName,// item.FirstName,
                LastName = lastName,//item.LastName,
                CreationDate = creationDate,// item.CreationDate,
                LastLoginDate = lastLoginDate,// item.LastLoginDate < item.CreationDate ? item.CreationDate : item.LastLoginDate,
                Disabled = disabled,// !item.Active,
                BMCMembership = null, //"(missing)"
                CreationMethod = MemberCreationMethod.DataLoad,
                PlainPassword = password
            };
            if (lastName == "Administrator")
            {
                m.FirstName = "";
                m.LastName = "Administrator";
                m.IsAdministrator = true;
                m.CreationMethod = MemberCreationMethod.SystemGenerated;
            }
            else
            {
                m.CreationMethod = MemberCreationMethod.DataLoad;
            }
            coreDb.Members.Add(m);

            return m;
        }
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
        private string GetLegacyBookingConnectionString()
        {
            try
            {
                string cs = Settings.legacy.bookingConnectionStringName;
                if (string.IsNullOrWhiteSpace(cs))
                {
                    throw new ApplicationException("No legacy booking connection string defined");
                }
                else
                {
                    return cs;
                }
            }
            catch (Exception xe)
            {
                Log.Write(xe);
                throw;
            }
        }

        private void LoadBookingData()
        {
            using (BookingDataContext bctx = new BookingDataContext())
            {
                SetParameters(bctx);
                CreateAccomodation(bctx);
                CreatePriceStructure(bctx);
                LoadBookings(bctx);
            }
        }

        private void SetParameters(BookingDataContext bctx)
        {
            Period pp = new Period
            {
                PeriodType = PeriodType.Rolling,
                Interval = new LongSpan { Years = 1 }
            };
            Parameter p = new Parameter
            {
                ForwardBookingPeriod = pp
            };
            bctx.Periods.Add(pp);
            bctx.Parameters.Add(p);
            bctx.SaveChanges();
        }

        private List<Period> LoadBlockedDays(BookingDataContext bctx)
        {
            var blockeddays = legacyBookingData.DayBook.Where(db => db.Day >= DateTime.Today && db.IsUnavailable).Select(d => d.Day).OrderBy(x => x).ToList();
            var result = blockeddays.GroupWhile((p, n) => n == p.AddDays(1));
            List<Period> blockedPeriods = new List<Period>();
            foreach (var set in result)
            {
                DateTime start = set.First();
                DateTime end = set.Last();
                Period p = new Period
                {
                    PeriodType = PeriodType.Fixed,
                    StartDate = start,
                    EndDate = end
                };
                blockedPeriods.Add(p);
            }
            return blockedPeriods;
        }
        private void LoadBookings(BookingDataContext bctx)
        {
            try
            {
                var forwardBookings = legacyBookingData.Bookings.Where(b => b.To > DateTime.Today && ((int)b.Status) != 2);
                foreach (var lBooking in forwardBookings)
                {
                    DWHMember member = coreDb.Members.Single(m => m.EmailAddress == lBooking.Visitor.Email) as DWHMember;
                    Debug.Assert(member != null);
                    Debug.Print("Loading {0}", lBooking.Reference);
                    BookingData.Booking b = new BookingData.Booking
                    {
                        CreatedOn = lBooking.BookingDate,
                        EntryInformation = lBooking.EntryInformation,
                        From = lBooking.From,
                        IsPaid = lBooking.IsPaid,
                        MemberId = member.Id,
                        Notes = lBooking.Notes,
                        Reference = lBooking.Reference,
                        To = lBooking.To,
                        TotalCost = lBooking.TotalCost,
                        Under18sInParty = lBooking.Under18sInParty
                    };
                    b.To = lBooking.ReleasedItems.Max(d => d.Date);
                    foreach (var ri in lBooking.ReleasedItems)
                    {
                        switch (ri.BookableItem.Name)
                        {
                            case "Don Whillans Hut":
                                Accomodation ac = bctx.AccomodationSet.Single(a => a.Type == AccomodationType.Hut);
                                b.AccomodationCollection.Add(ac);
                                break;
                            default:
                                Accomodation bed = bctx.AccomodationSet.Single(a => a.Type == AccomodationType.Bed && a.Name == ri.BookableItem.Name);
                                b.AccomodationCollection.Add(bed);
                                break;
                        }
                    }
                    bctx.Bookings.Add(b);
                }
                bctx.SaveChanges();
            }
            catch (Exception xe)
            {
                Debugger.Break();
                throw;
            }
        }
        private void CreatePriceStructure(BookingDataContext bctx)
        {
            PriceStructure ps = new PriceStructure
            {
                Name = "Default"
            };
            Period pp = new Period
            {
                PeriodType = PeriodType.Fixed,
                StartDate = DateTime.Parse("1/1/2014"),
                EndDate = null // i.e. forever
            };
            Price bedPrice = new Price
            {
                Period = pp,
                Amount = 10.0M,
                Class = AccomodationClass.Standard,
                Type = AccomodationType.Bed,
                MinimumUnits = 1
            };
            Price hutPrice = new Price
            {
                Period = pp,
                Amount = 120.0M,
                Class = AccomodationClass.Standard,
                Type = AccomodationType.Hut,
                MinimumUnits = 1
            };
            ps.Periods.Add(pp);
            bctx.Prices.Add(bedPrice);
            bctx.Prices.Add(hutPrice);
            bctx.PriceStructures.Add(ps);
            bctx.SaveChanges();
        }
        private void CreateAccomodation(BookingDataContext bctx)
        {
            Action<List<dynamic>, Accomodation> load = null;
            load = (l, acc) =>
            {
                foreach (dynamic item in l)
                {
                    string at = item.accomodationtype;
                    AccomodationType type = (AccomodationType)Enum.Parse(typeof(AccomodationType), at, true);
                    string ac = item.accomodationclass;
                    AccomodationClass c = (AccomodationClass)Enum.Parse(typeof(AccomodationClass), ac, true);
                    string name = item.name;
                    bool bookable = item.bookable;
                    bool? sisb = item.subItemsSeparatelyBookable;
                    List<dynamic> subitems = ((JArray)item.subitems)?.ToObject<List<dynamic>>();
                    Debug.Print("item: {0}", name);
                    Accomodation a = new Accomodation
                    {
                        Class = c,// AccomodationClass.Standard,
                        Type = type,
                        Name = name,
                        Bookable = bookable,
                        SubAccomodationSeparatelyBookable = sisb?? false
                    };
                    if (acc != null)
                    {
                        acc.SubAccomodation.Add(a);
                    }
                    if (subitems != null)
                    {
                        load(subitems, a);
                    }
                    bctx.AccomodationSet.Add(a);
                    //Debugger.Break();
                }
            };
            List<dynamic> bookingAccomodation = ((JArray)Settings.bookingApp.accomodation).ToObject<List<dynamic>>();
            load(bookingAccomodation, null);
            bctx.SaveChanges();

            // availabilities
            var blockedPeriods = LoadBlockedDays(bctx);

            foreach (Accomodation acc in bctx.AccomodationSet.Where(x => x.ParentAccomodation == null))
            {
                Period pp = new Period
                {
                    PeriodType = PeriodType.Rolling,
                    Interval = new LongSpan { Years = 1 }
                };

                Availability a1 = new Availability
                {
                    Accomodation = acc,
                    Period = pp
                };
                foreach (var p in blockedPeriods)
                {
                    Availability a = new Availability
                    {
                        Accomodation = acc,
                        Period = p,
                        Blocked = true
                    };
                    bctx.Availablities.Add(a);
                }
                bctx.Availablities.Add(a1);
            };

            bctx.SaveChanges();
        }
    }
    static class _extensions
    {
        public static IEnumerable<IEnumerable<T>> GroupWhile<T>(this IEnumerable<T> source, Func<T, T, bool> predicate)
        {
            using (var iterator = source.GetEnumerator())
            {
                if (!iterator.MoveNext())
                    yield break;

                List<T> currentGroup = new List<T>() { iterator.Current };
                while (iterator.MoveNext())
                {
                    if (predicate(currentGroup.Last(), iterator.Current))
                        currentGroup.Add(iterator.Current);
                    else
                    {
                        yield return currentGroup;
                        currentGroup = new List<T>() { iterator.Current };
                    }
                }
                yield return currentGroup;
            }
        }
    }
}