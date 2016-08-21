using Fastnet.Common;
using Fastnet.EventSystem;
using Fastnet.Web.Common;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.WebApi;
using Newtonsoft.Json.Linq;
//using Fastnet.Webframe.Web.Models.Core;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Infrastructure;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web.Hosting;
using System.Web.Http;
//using Data = Fastnet.Webframe.CoreData;

namespace Fastnet.Webframe.Web.Controllers
{

    [RoutePrefix("pageapi")]
    public class PageController : BaseApiController// ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        [Route("home")]
        public HttpResponseMessage GetHomePage()
        {
            Page defaultlandingPage = Member.Anonymous.FindLandingPage();
            this.SetCurrentPage(defaultlandingPage);
            return this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = defaultlandingPage.PageId.ToString() });
        }
        [HttpGet]
        [Route("page/{id}")]
        public HttpResponseMessage GetPage(string id)
        {
            long pageId = Int64.Parse(id);
            var m = GetCurrentMember();
            Page page = DataContext.Pages.Find(pageId);
            AccessResult ar = m.GetAccessResult(page);
            object data = null;
            if (ar == AccessResult.Rejected)
            {
                data = PrepareAccessDenied(page);
                return this.Request.CreateResponse(HttpStatusCode.OK, data);
            }
            else if (this.Request.IsModified(page.PageMarkup.LastModifiedOn, page.PageId))
            {
                if (page.MarkupType == MarkupType.DocX)
                {
                    data = PrepareDocXpage(page);
                }
                else if (page.MarkupType == MarkupType.Html)
                {
                    data = PrepareHTMLPage(page);
                }

            }
            return this.Request.CreateCacheableResponse(HttpStatusCode.OK, data, page.PageMarkup.LastModifiedOn, page.PageId);
        }
        [HttpGet]
        [Route("page/access/{id}")]
        public HttpResponseMessage GetAccessResult(string id)
        {
            var admins = Group.Administrators;
            long pageId = Int64.Parse(id);
            Page page = DataContext.Pages.Find(pageId);
            var m = GetCurrentMember();
            TraceAccess("page/access/ call :: test access: member {0}, {1}", m.Fullname, page.Url);
            AccessResult ar = m.GetAccessResult(page);
            TraceAccess("page/access/ call :: member {0}, page {1}, access result: {2}", m.Fullname, page.Url, ar.ToString());
            string descr = ar.ToString().ToLower();
            //bool result = admins.Members.Contains(m) || m.CanEdit(page);
            return this.Request.CreateResponse(HttpStatusCode.OK, new { Access = descr });
        }
        [HttpGet]
        [Route("sidepages/{id}")]
        public HttpResponseMessage GetSidePages(string id)
        {
            Page centrePage = DataContext.Pages.Find(Int64.Parse(id));
            var Banner = centrePage.FindSidePage(PageType.Banner, true);
            var Left = centrePage.FindSidePage(PageType.Left, true);
            var Right = centrePage.FindSidePage(PageType.Right, true);
            if (ApplicationSettings.Key("TraceSidePages", false))
            {
                Log.Write("PageController::GetSidePages(): centre {0}, banner {1}, left {2}, right {3}", centrePage.Url,
                    Banner == null ? "none" : Banner.Url,
                    Left == null ? "none" : Left.Url,
                    Right == null ? "none" : Right.Url);
            }
            Func<Page, dynamic> getInfo = (p) =>
            {
                object nullObject = null;
                if (p == null)
                {
                    return new { Id = nullObject, Menu = nullObject };
                }
                else
                {
                    // for the time being only return the first
                    if (p.MenuMasters.Count() > 0)
                    {
                        return new { Id = p.PageId, Menu = p.MenuMasters.First().Id, MenuList = p.MenuMasters.OrderBy(x => x.Name).Select(x => x.Id) };
                    }
                    else
                    {
                        return new { Id = p.PageId, Menu = nullObject, MenuList = nullObject };
                    }
                }
            };
            var result = new
            {
                Banner = getInfo(Banner),
                Left = getInfo(Left),
                Right = getInfo(Right)
            };
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("menupanel/get/menumasters")]
        public async Task<HttpResponseMessage> GetMenuPanelMenuMaster()
        {
            var masterList = DataContext.MenuMasters.Where(x => x.PanelName == PanelNames.MenuPanel);
            var result = await masterList.Select(mm => mm.Id).ToArrayAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        //[HttpGet]
        //[Route("menumaster/{id?}")]
        //public HttpResponseMessage GetMenuInfo(long? id = null)
        //{
        //    // if id is null, we assume menupanel masters
        //    var masterList = DataContext.MenuMasters.AsQueryable();
        //    if (id.HasValue)
        //    {
        //        masterList = masterList.Where(x => x.Id == id.Value);
        //    }
        //    else
        //    {
        //        masterList = masterList.Where(x => x.PanelName == PanelNames.MenuPanel && x.IsDisabled == false);
        //    }
        //    var result = masterList.Select(x => new
        //    {
        //        Id = x.Id,
        //        ClassName = x.ClassName.ToLower(),
        //        Name = x.Name.ToLower(),
        //        Panel = x.PanelName.ToString().ToLower()
        //    });
        //    return this.Request.CreateResponse(HttpStatusCode.OK, result);
        //}
        [HttpPost]
        [Route("menu/master")]
        public async Task<HttpResponseMessage> GetMasters(dynamic data)
        {
            Func<MenuMaster, string> getPanelName = (mm) =>
            {
                if (mm.PanelName == PanelNames.MenuPanel)
                {
                    return mm.PanelName.ToString().ToLower();
                }
                else
                {
                    if (mm.Page != null)
                    {
                        switch (mm.Page.Type)
                        {
                            case PageType.Banner:
                                return "bannerpanel";
                            case PageType.Left:
                                return "leftpanel";
                            case PageType.Right:
                                return "rightpanel";
                        }
                    }
                    return "none";
                }
            };
            string option = data.option;
            IEnumerable<MenuMaster> masterList = null;
            if (option == "formenupanel") // soon obsolete
            {
                masterList = DataContext.MenuMasters.Where(x => x.PanelName == PanelNames.MenuPanel);
            }
            else
            {
                long[] idList = ((JArray)data.idList).ToObject<long[]>();
                var list = new List<MenuMaster>();
                foreach (var id in idList)
                {
                    var mm = await DataContext.MenuMasters.FindAsync(id);
                    list.Add(mm);
                }
                masterList = list.OrderBy(x => x.Name);
            }
            var result = masterList.Select(x => new
            {
                Id = x.Id,
                ClassName = x.ClassName.ToLower(),
                Name = x.Name.ToLower(),
                Panel = getPanelName(x)// x.PanelName.ToString().ToLower()
            });
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("menu/{id}")]
        public async Task<HttpResponseMessage> GetMenu(long id)
        {
            Func<Menu, bool> canAccess = (m) =>
            {
                if (m.Url != null)
                {
                    string loweredurl = m.Url.ToLower();
                    if (loweredurl.StartsWith("/"))
                    {
                        loweredurl = loweredurl.Substring(1);
                    }
                    if (loweredurl.StartsWith("cms/"))
                    {
                        loweredurl = "cms";
                    }
                    switch (loweredurl)
                    {
                        case "cms":
                        case "designer":
                        case "membership":
                            return canAccessBuiltinApps(loweredurl);
                        case "login":
                        case "logout":
                            return canAccessLoginOut(loweredurl);
                    }
                    if (loweredurl.StartsWith("page/") || loweredurl.StartsWith("document/") || loweredurl.StartsWith("image/"))
                    {
                        TraceAccess("menu item call :: test access: {0}", loweredurl);
                        return canAccessInternalUrl(loweredurl);
                    }
                }
                return true;
            };
            Func<Menu, bool> canInclude = null;
            canInclude = (m) =>
            {
                bool r = false;
                if (canAccess(m))
                {
                    if (m.Url != null)
                    {
                        r = true;
                    }
                    else
                    {
                        r = m.Submenus.Any(x => canInclude(x));
                    }
                }
                return r;
            };

            Func<IEnumerable<Menu>, int, dynamic> getSubmenus = null;
            getSubmenus = (menus, l) =>
            {
                var r = menus.Where(x => canInclude(x)).OrderBy(x => x.Index).Select(x => new
                {
                    Level = l,
                    Index = x.Index,
                    Text = x.Text,
                    Url = x.Url,
                    Submenus = getSubmenus(x.Submenus, l + 1),
                });

                return r;
            };
            int level = 0;
            var mm = await DataContext.MenuMasters.FindAsync(id);
            object result = getSubmenus(mm.Menus.ToArray(), level);
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("~/image/{id}")]
        public HttpResponseMessage GetImage(long id)
        {
            Image image = DataContext.Images.Find(id);
            MemoryStream ms = new MemoryStream(image.Data);
            HttpResponseMessage response = this.Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new StreamContent(ms);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue(image.MimeType);
            CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromDays(30) };
            response.Headers.CacheControl = cchv;
            return response;
        }
        [HttpGet]
        [Route("banner")]
        public HttpResponseMessage GetDefaultBannerPageId()
        {
            Page defaultlandingPage = Member.Anonymous.FindLandingPage();
            Page bannerPage = defaultlandingPage.FindSidePage(PageType.Banner, true);
            return this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = bannerPage.PageId });
        }
        //
        private dynamic PrepareHTMLPage(Page page)
        {
            string htmlText = page.PageMarkup.HtmlText;
            var location = page.Directory.DisplayName;
            return new { PageId = page.PageId, Location = location, HtmlText = htmlText, HtmlStyles = string.Empty };
        }
        private dynamic PrepareDocXpage(Page page)
        {
            string htmlText = page.PageMarkup.HtmlText;
            string htmlStyles = page.PageMarkup.HtmlStyles;
            HtmlParser hp = new HtmlParser(htmlStyles);
            var styleRules = hp.GetLegacyStyleRules();
            // now merge multiple styles into one
            var allRules = styleRules.SelectMany(x => x);
            var location = page.Directory.DisplayName;
            return new { PageId = page.PageId, Location = location, HtmlText = htmlText, HtmlStyles = allRules };
        }
        private dynamic PrepareAccessDenied(Page page)
        {
            string htmlFile = page.Type == PageType.Centre ? "~/Default Pages/AccessDenied.html" : "~/Default Pages/Blank page.html";
            string filename = HostingEnvironment.MapPath(htmlFile);
            string htmlText = System.IO.File.ReadAllText(filename);
            return new { PageId = -1, Location = string.Empty, HtmlText = htmlText, HtmlStyles = string.Empty };
        }

        //private bool IsContentModified(Page page)
        //{
        //    var ifModifiedSince = Request.Headers.IfModifiedSince;
        //    var ifNoneMatch = Request.Headers.IfNoneMatch;
        //    var temp = ifNoneMatch.FirstOrDefault();
        //    string receivedTag = temp == null ? null : temp.Tag;
        //    var modifiedOn = page.PageMarkup.LastModifiedOn;// DateTime.SpecifyKind(page.PageMarkup.CreatedOn, DateTimeKind.Utc);
        //    string etag = CreateEtag(page.PageId, page.PageMarkup.LastModifiedOn);
        //    return etag != receivedTag || ifModifiedSince.HasValue == false || (modifiedOn - ifModifiedSince.Value) > TimeSpan.FromSeconds(1);
        //}
        //private string CreateEtag(params object[] args)
        //{
        //    string t = "";
        //    foreach (object arg in args)
        //    {
        //        //Debug.Print("Etag: {0} {1:x}", arg.ToString(), arg.GetHashCode());
        //        t += string.Format("{0:x}", arg.GetHashCode());
        //    }
        //    string etag = "\"" + t + "\"";
        //    return etag;
        //}

        private bool canAccessInternalUrl(string loweredurl)
        {
            try
            {
                var m = GetCurrentMember();
                //string entity = null;
                long id = 0;
                AccessResult ar = AccessResult.Rejected;
                if (loweredurl.StartsWith("page/"))
                {
                    //entity = "page";
                    id = Convert.ToInt64(loweredurl.Substring(5));
                    Page p = DataContext.Pages.Find(id);
                    if (p != null)
                    {
                        ar = m.GetAccessResult(p);
                    }
                }
                else if (loweredurl.StartsWith("document/"))
                {
                    //entity = "document";
                    id = Convert.ToInt64(loweredurl.Substring(9));
                    Document d = DataContext.Documents.Find(id);
                    if (d != null)
                    {
                        ar = m.GetAccessResult(d);
                    }
                }
                else
                {
                    //entity = "image";
                    id = Convert.ToInt64(loweredurl.Substring(6));
                    Image img = DataContext.Images.Find(id);
                    if (img != null)
                    {
                        ar = m.GetAccessResult(img);
                    }
                }
                return ar != AccessResult.Rejected;
            }
            catch (Exception xe)
            {
                Log.Write(xe, "Invalid internal url {0}", loweredurl);
                throw;
            }
        }
        private void TraceAccess(string fmt, params object[] args)
        {
            bool trace = ApplicationSettings.Key("Trace:Access", false);
            if (trace)
            {
                Log.Write(fmt, args);
            }
        }

        private bool canAccessLoginOut(string loweredurl)
        {
            var m = GetCurrentMember();
            if (loweredurl == "login")
            {
                return Group.Anonymous.Members.Contains(m);
            }
            if (loweredurl == "logout")
            {
                return Group.AllMembers.Members.Contains(m);
            }
            return false;
        }
        private bool canAccessBuiltinApps(string loweredurl)
        {
            var m = GetCurrentMember();
            switch (loweredurl)
            {
                case "cms":
                case "membership":
                    return Group.Administrators.Members.Contains(m);
                case "designer":
                    return Group.Designers.Members.Contains(m);

            }
            return false;
        }
    }

}
