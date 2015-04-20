using Fastnet.Webframe.CoreData;
//using Fastnet.Webframe.Web.Models.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Net.Http;
using System.Web.Http;
using Data = Fastnet.Webframe.CoreData;

namespace Fastnet.Webframe.Web.Controllers
{
    using Microsoft.AspNet.Identity;
    using Microsoft.AspNet.Identity.Owin;
    using Microsoft.Owin.Security;
    using System.Dynamic;
    using System.Diagnostics;
    using System.Net.Http.Headers;
    using Fastnet.Webframe.Web.Common;
using System.IO;
    [RoutePrefix("pageapi")]
    public class PageController : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        //[Route("home/{id?}")]
        [Route("home")]
        //public HttpResponseMessage GetHomePage(long? id = null)
        public HttpResponseMessage GetHomePage()
        {
            //reminder I need to find the current user to do home page correctly!
            //if (id.HasValue)
            //{
            //    //var httpResponseMessage =  this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = id.Value.ToString() });
            //    var httpResponseMessage = this.Request.CreateResponse(HttpStatusCode.Found);
            //    httpResponseMessage.Headers.Location = new Uri(string.Format("/pageapi/page/{0}", id.Value ), UriKind.Relative);
            //    return httpResponseMessage;
            //}
            var allLandingPages = DataContext.FindAllLandingPages();
            Data.Page page = null;
            if (allLandingPages.Count() > 1)
            {
                page = allLandingPages.OrderByDescending(p => p.PageId).First();
            }
            else
            {
                page = allLandingPages.First();
            }
            return this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = page.PageId.ToString() });
  
        }
        [HttpGet]
        [Route("page/{id}")]
        public HttpResponseMessage GetPage(string id)
        {
            long pageId = Int64.Parse(id);
            //HttpContext.Current.Session["CurrentPage"] = pageId;
            Data.Page page = DataContext.Pages.Find(pageId);
            object data = null;
            if(this.Request.IsModified(page.PageMarkup.CreatedOn, page.PageId))
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
            return this.Request.CreateCacheableResponse(HttpStatusCode.OK, data, page.PageMarkup.CreatedOn, page.PageId);
            //if (th
            //{
            //    HttpResponseMessage response = this.Request.CreateResponse(HttpStatusCode.OK, data);
            //    response.Content.Headers.LastModified = page.PageMarkup.CreatedOn;
            //    response.Headers.ETag = new EntityTagHeaderValue(CreateEtag(page.PageId, page.PageMarkup.CreatedOn));
            //    CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
            //    response.Headers.CacheControl = cchv;
            //    return response;
            //}
            //else
            //{
            //    HttpResponseMessage response = this.Request.CreateResponse(HttpStatusCode.NotModified);
            //    //response.Content.Headers.LastModified = page.PageMarkup.CreatedOn;
            //    //response.Headers.ETag = new EntityTagHeaderValue(CreateEtag(page.PageId, page.PageMarkup.CreatedOn));
            //    //CacheControlHeaderValue cchv = new CacheControlHeaderValue { Public = true, MaxAge = TimeSpan.FromMinutes(maxAge) };
            //    //response.Headers.CacheControl = cchv;
            //    return response;
            //}
            //return this.Request.CreateResponse(HttpStatusCode.NotFound);
        }
        [HttpGet]
        [Route("panelinfo/{id}")]
        public HttpResponseMessage GetSidePanelInformation(string id)
        {
            //Func<Data.Page, Data.Panel, dynamic> getPanelInfo = (cp, p) =>
            //    {
            //        dynamic x = new ExpandoObject();
            //        x.Name = p.Name;
            //        //x.Height = p.PixelHeight;
            //        //x.Width = p.PixelWidth;
            //        x.Visible = p.Visible;
            //        if (x.Visible)
            //        {
            //            var sp = FindSidePage(cp, p);
            //            x.PageId = sp != null ? sp.PageId.ToString() : null;
            //        }
            //        return x;
            //    };
            Data.Page centrePage = DataContext.Pages.Find(Int64.Parse(id));
            var result = new
            {
                BannerPanel = GetPanelInfo(centrePage, Data.Panel.BannerPanel),
                LeftPanel = GetPanelInfo(centrePage, Data.Panel.LeftPanel),
                RightPanel = GetPanelInfo(centrePage, Data.Panel.RightPanel)
            };
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("menuinfo")]
        public HttpResponseMessage GetMenuInfo()
        {
            bool isVisible = Data.Panel.MenuPanel.Visible;
            var info = new { Visible = isVisible, MenuHtml = DataContext.GetMenuHtml(GetCurrentMember()) };
            return this.Request.CreateResponse(HttpStatusCode.OK, info);
        }
        [HttpGet]
        [Route("~/image/{id}")]
        public HttpResponseMessage GetImage(long id)
        {
            Data.ImageInformation image = DataContext.ImageInformata.Find(id);
            MemoryStream ms = new MemoryStream(image.Image);
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
            var allLandingPages = DataContext.FindAllLandingPages();
            Data.Page page = null;
            if (allLandingPages.Count() > 1)
            {
                page = allLandingPages.OrderByDescending(p => p.PageId).First();
            }
            else
            {
                page = allLandingPages.First();
            }
            var bannerPanel = GetPanelInfo(page, Data.Panel.BannerPanel);
            return this.Request.CreateResponse(HttpStatusCode.OK, new { Visible = bannerPanel.Visible, PageId = bannerPanel.PageId });
        }

        private dynamic PrepareHTMLPage(Page page)
        {
            string htmlText = page.PageMarkup.HtmlText;
            return new { PageId = page.PageId, HtmlText = htmlText, HtmlStyles = string.Empty };
        }
        private dynamic PrepareDocXpage(Page page)
        {
            string htmlText = page.PageMarkup.HtmlText;
            string htmlStyles = page.PageMarkup.HtmlStyles;
            HtmlParser hp = new HtmlParser(htmlStyles);
            var styleRules = hp.GetLegacyStyleRules();
            // now merge multiple styles into one
            var allRules = styleRules.SelectMany(x => x);
            return new { PageId = page.PageId, HtmlText = htmlText, HtmlStyles = allRules };
        }
        /// <summary>
        /// Get the page required for the requestedpanel when the reference page is in the centre panel
        /// </summary>
        /// <param name="referencePage">centre page</param>
        /// <param name="panel">requested panel</param>
        private Page FindSidePage(Data.Page referencePage, Data.Panel panel)
        {
            Data.PanelPage panelPage = referencePage.SidePanelPages.SingleOrDefault(pp => pp.Panel.PanelId == panel.PanelId);
            Data.Page sidePage = panelPage != null ? panelPage.Page : null;
            if (sidePage == null)
            {
                Data.Page alternatePage = GetAlternatePage(referencePage);
                if (alternatePage != null)
                {
                    sidePage = FindSidePage(alternatePage, panel);
                }
            }
            if (sidePage == null)
            {
                Data.Page closest = GetClosestHomePage(referencePage);
                if (closest != null)
                {
                    sidePage = FindSidePage(closest, panel);
                }
            }
            return sidePage;
        }
        private Data.Page GetAlternatePage(Page referencePage)
        {
            Data.Page alternatePage = null;
            if (!string.IsNullOrWhiteSpace(referencePage.InheritSideContentFromUrl))
            {
                long id = Convert.ToInt64(referencePage.InheritSideContentFromUrl.Split('/')[2]);
                alternatePage = DataContext.Pages.SingleOrDefault(x => x.PageId == id);
            }
            return alternatePage;
        }
        private Data.Page GetClosestHomePage(Page referencePage)
        {
            Func<Data.Directory, Data.Page> findLandingPage = (dir) =>
            {
                return dir.Pages.SingleOrDefault(x => x.IsLandingPage);
            };
            Data.Directory cd = referencePage.Directory;
            if (referencePage.IsLandingPage)
            {
                cd = referencePage.Directory.ParentDirectory;
            }

            Data.Page lp = null;
            do
            {
                if (cd == null)
                {
                    // we have traversed up the entire tree and not found any landing page
                    break;
                }
                else
                {
                    lp = findLandingPage(cd);
                    if (lp == null)
                    {
                        cd = cd.ParentDirectory;
                    }
                }
            } while (lp == null);
            return lp;
        }
        private Data.Member GetCurrentMember()
        {
            if (User.Identity.IsAuthenticated)
            {
                var userId = Convert.ToInt64( User.Identity.GetUserId());
                return DataContext.Members.Find(userId);
            }
            return null;
        }
        private bool IsContentModified(Data.Page page)
        {
            var ifModifiedSince = Request.Headers.IfModifiedSince;
            var ifNoneMatch = Request.Headers.IfNoneMatch;
            var temp = ifNoneMatch.FirstOrDefault();
            string receivedTag = temp == null ? null : temp.Tag;
            var modifiedOn = DateTime.SpecifyKind(page.PageMarkup.CreatedOn, DateTimeKind.Utc);
            string etag = CreateEtag(page.PageId, page.PageMarkup.CreatedOn);
            return etag != receivedTag || ifModifiedSince.HasValue == false || (modifiedOn - ifModifiedSince.Value) > TimeSpan.FromSeconds(1);
        }
        //private void SetCacheInfo(Page page)
        //{
        //    var ifModifiedSince = Request.Headers.IfModifiedSince;
        //    var ifNoneMatch = Request.Headers.IfNoneMatch;
        //    var modifiedOn = DateTime.SpecifyKind(page.PageMarkup.CreatedOn, DateTimeKind.Utc);
        //    //DateTime requestIfModifiedSince = DateTime.MinValue;
        //    //DateTime.TryParse(ifModifiedSince, out requestIfModifiedSince);
        //    //requestIfModifiedSince = requestIfModifiedSince.ToUniversalTime();
        //    //string requestEtag = ifNoneMatch;  
        //    Debugger.Break();
        //}
        private string CreateEtag(params object[] args)
        {
            string t = "";
            foreach (object arg in args)
            {
                //Debug.Print("Etag: {0} {1:x}", arg.ToString(), arg.GetHashCode());
                t += string.Format("{0:x}", arg.GetHashCode());
            }
            string etag = "\"" + t + "\"";
            return etag;
        }
        private dynamic GetPanelInfo(Data.Page cp, Data.Panel p)
        {
            dynamic x = new ExpandoObject();
            x.Name = p.Name;
            //x.Height = p.PixelHeight;
            //x.Width = p.PixelWidth;
            x.Visible = p.Visible;
            if (x.Visible)
            {
                var sp = FindSidePage(cp, p);
                x.PageId = sp != null ? sp.PageId.ToString() : null;
            }
            return x;
        }
    }
}
