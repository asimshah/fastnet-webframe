using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web;
using System.Text;
using System.Diagnostics;
using Fastnet.EventSystem;
using Newtonsoft.Json.Linq;


namespace Fastnet.Webframe.Web.Controllers
{
    [RoutePrefix("store")]
    //[Authorize]
    public class StoreController : ApiController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        private string CurrentMemberId
        {
            get
            {
                if (HttpContext.Current.Session["member-id"] == null)
                {
                    return null;
                }
                return (string)HttpContext.Current.Session["member-id"];
            }
        }
        [HttpGet]
        [Route("directories/{id?}")]
        public Task<HttpResponseMessage> GetDirectories(long? id = null)
        {
            //var directories = null;
            if (!id.HasValue)
            {
                var rd = DataContext.Directories.Single(d => d.ParentDirectory == null);
                var data = new List<dynamic>();
                data.Add(new { Id = rd.DirectoryId, Name = "Store", SubdirectoryCount = rd.SubDirectories.Count });
                return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
            }
            var directories = DataContext.Directories.Where(d => d.ParentDirectory.DirectoryId == id.Value)
                .OrderBy(x => x.Name)
                .Select(x => new { Id = x.DirectoryId, Name = x.Name, SubdirectoryCount = x.SubDirectories.Count() });
            return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, directories));
        }
        [HttpGet]
        [Route("content/{id}")]
        public Task<HttpResponseMessage> GetDirectoryContent(long id)
        {
            var allPages = DataContext.Pages.Where(p => p.DirectoryId == id)
                .OrderBy(x => x.PageId);
            List<dynamic> folderContent = new List<dynamic>();
            foreach (var page in allPages)
            {
                if (page.CentrePanelPages.Count() == 0)
                {
                    bool bp = false; // banner panel
                    bool lp = false; // left panel
                    bool rp = false; // right panel
                    foreach (var pp in page.SidePanelPages)
                    {
                        switch (pp.Panel.Name)
                        {
                            case "BannerPanel":
                                bp = true;
                                break;
                            case "LeftPanel":
                                lp = true;
                                break;
                            case "RightPanel":
                                rp = true;
                                break;
                        }
                    }
                    folderContent.Add(new
                    {
                        Type = "page",
                        Id = page.PageId,
                        Url = page.Url,
                        Name = page.Name,
                        HasBanner = bp,
                        HasLeft = lp,
                        HasRight = rp,
                        LandingPage = page.IsLandingPage
                    });
                }
            }
            return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, folderContent));
        }
        [HttpPost]
        [Route("createdirectory")]
        public async Task<HttpResponseMessage> CreateNewDirectory(dynamic data)
        {
            if (CurrentMemberId != null)
            {
                bool result = true;
                try
                {
                    long directoryId = data.directoryId;
                    Directory parent = DataContext.Directories.Find(directoryId);
                    Directory dir = new Directory();
                    dir.Name = GetUniqueDirectoryName(parent);
                    dir.ParentDirectory = parent;
                    DataContext.Directories.Add(dir);
                    await DataContext.SaveChangesAsync();
                    return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, new { DirectoryId = dir.DirectoryId, Name = dir.Name }));
                }
                catch (Exception xe)
                {
                    Log.Write(xe.Message);
                    result = false;

                }
                if (!result)
                {
                    return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
                }
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpPost]
        [Route("createpage")]
        public async Task<HttpResponseMessage> CreateNewPage(dynamic data)
        {
            if (CurrentMemberId != null)
            {
                bool result = true;
                try
                {
                    long directoryId = data.directoryId;
                    Member m = DataContext.Members.Find(CurrentMemberId);
                    Directory dir = DataContext.Directories.Find(directoryId);
                    Page page = DataContext.CreateNewPage();
                    PageMarkup pm = page.PageMarkup;
                    pm.CreatedBy = m.Fullname;
                    pm.CreatedOn = DateTime.UtcNow;
                    pm.TimeStamp = BitConverter.GetBytes(-1);


                    page.TimeStamp = BitConverter.GetBytes(-1);
                    page.Visible = true;
                    page.VersionCount = 0;
                    page.Name = GetUniquePageName(dir);
                    page.Directory = dir;
                    page.MarkupType = MarkupType.Html;
                    page.PageMarkup = pm;
                    string defaultPagesFolder = HttpContext.Current.Server.MapPath("~/Default Pages");
                    string blankHtmlFile = System.IO.Path.Combine(defaultPagesFolder, "Blank Page.html");
                    byte[] htmlData = System.IO.File.ReadAllBytes(blankHtmlFile);
                    pm.HtmlText = Encoding.Default.GetString(htmlData);
                    await DataContext.SaveChangesAsync();
                    //long pageId = page.PageId;
                    return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = page.PageId, Url = page.Url }));
                }
                catch (Exception xe)
                {
                    Log.Write(xe.Message);
                    result = false;

                }
                if (!result)
                {
                    return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
                }
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpPost]
        [Route("delete")]
        public async Task<HttpResponseMessage> DeleteItem(dynamic data)
        {
            if (CurrentMemberId != null)
            {
                bool result = true;
                try
                {
                    long id = data.id;
                    switch ((string)data.type)
                    {
                        case "page":
                            await DeletePage(id);
                            break;
                        case "directory":
                            await DeleteDirectory(id);
                            break;
                    }
                }
                catch (Exception xe)
                {
                    Log.Write(xe);
                    result = false;

                }
                if (!result)
                {
                    return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.InternalServerError));
                }

            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
        }
        [HttpGet]
        [Route("get/directory/{id}")]
        public async Task<HttpResponseMessage> GetDirectoryDetails(long id)
        {
            if (CurrentMemberId != null)
            {
                Directory d = DataContext.Directories.Find(id);
                var data = new
                {
                    Id = d.DirectoryId,
                    Name = d.Name
                };
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.Forbidden));
        }
        [HttpPost]
        [Route("update/directory")]
        public async Task<HttpResponseMessage> UpdateDirectory(dynamic data)
        {
            if (CurrentMemberId != null)
            {
                long id = data.id;
                Directory d = DataContext.Directories.Find(id);
                d.Name = data.name;
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.Forbidden));
        }
        [HttpGet]
        [Route("get/page/{id}")]
        public async Task<HttpResponseMessage> GetPageDetails(long id)
        {
            if (CurrentMemberId != null)
            {
                Page p = DataContext.Pages.Find(id);
                var data = new
                {
                    Id = p.PageId,
                    Url = p.Url,
                    Name = p.Name,
                    CreatedBy = p.PageMarkup.CreatedBy,
                    CreatedOn = p.PageMarkup.CreatedOn.ToString("ddMMMyyyy HH:mm"),
                    ModifiedBy = p.PageMarkup.ModifiedBy,
                    ModifiedOn = p.PageMarkup.ModifiedOn.HasValue ? p.PageMarkup.ModifiedOn.Value.ToString("ddMMMyyyy HH:mm") : "",
                    ModificationState = p.PageMarkup.ModifiedOn.HasValue ? "visible" : "hidden"
                };
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, data));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.Forbidden));
        }
        [HttpGet]
        [Route("panelinfo/{id}")]
        public HttpResponseMessage GetSidePanelInformation(string id)
        {
            Func<Page, long?> getPageId = (p) =>
                {
                    if (p == null)
                    {
                        return null;
                    }
                    else
                    {
                        return p.PageId;
                    }
                };
            Func<Page, Panel, Page> sidePanelPage = (cp, panel) =>
            {
                Page sp = null;
                if (panel.Visible)
                {
                    PanelPage panelPage = cp.SidePanelPages.SingleOrDefault(pp => pp.Panel.PanelId == panel.PanelId);
                    sp = panelPage != null ? panelPage.Page : null;
                }
                return sp;
            };
            Page centrePage = DataContext.Pages.Find(Int64.Parse(id));
            Page bp = sidePanelPage(centrePage, Panel.BannerPanel);
            Page lp = sidePanelPage(centrePage, Panel.LeftPanel);
            Page rp = sidePanelPage(centrePage, Panel.RightPanel);
            var result = new
            {
                BannerPanel = new { PageId = getPageId(bp) },
                LeftPanel = new { PageId = getPageId(lp) },
                RightPanel = new { PageId = getPageId(rp) }
            };
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpPost]
        [Route("update/page")]
        public async Task<HttpResponseMessage> UpdatePage(dynamic data)
        {
            if (CurrentMemberId != null)
            {

                long id = data.id;
                Page p = DataContext.Pages.Find(id);
                p.Name = data.name;
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.Forbidden));
        }
        [HttpPost]
        [Route("update/page/content")]
        public async Task<HttpResponseMessage> UpdatePageContent(dynamic data)
        {
            if (CurrentMemberId != null)
            {
                Member m = DataContext.Members.Find(CurrentMemberId);

                //Action<long, string> updatePage = (id, htmlText) =>
                //    {
                //        Page page = DataContext.Pages.Find(id);
                //        PageMarkup pm = page.PageMarkup;
                //        pm.HtmlText = htmlText;
                //        pm.HtmlTextLength = htmlText.Length;
                //        pm.ModifiedBy = m.Fullname;
                //        pm.ModifiedOn = DateTime.UtcNow;
                //        page.MarkupType = MarkupType.Html;
                //    };
                Action<dynamic> update = (p) =>
                {
                    string pageId = p.PageId;
                    if(pageId != null)                    
                    {
                        bool changed = (bool)p.HasChanged;
                        if (changed)
                        {
                            long id = Convert.ToInt64(pageId);
                            string htmlText = (string)p.HtmlText;
                            Page page = DataContext.Pages.Find(id);
                            PageMarkup pm = page.PageMarkup;
                            pm.HtmlText = htmlText;
                            pm.HtmlTextLength = htmlText.Length;
                            pm.ModifiedBy = m.Fullname;
                            pm.ModifiedOn = DateTime.UtcNow;
                            page.MarkupType = MarkupType.Html;
                        }
                    }
                };
                // ((Newtonsoft.Json.Linq.JObject)data).ToObject<dynamic>().BannerPanel.PageId
                //(string)(data as dynamic).BannerPanel.PageId

                update((data as dynamic).BannerPanel);
                update((data as dynamic).LeftPanel);
                update((data as dynamic).CentrePanel);
                update((data as dynamic).RightPanel);
                await DataContext.SaveChangesAsync();
                return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.Forbidden));
        }
        //
        //
        private async Task DeleteDirectory(long id)
        {
            using (var tran = DataContext.Database.BeginTransaction())
            {
                try
                {
                    Directory d = DataContext.Directories.Find(id);
                    await DeleteDirectory(d);
                    tran.Commit();
                }
                catch (Exception)
                {
                    tran.Rollback();
                    //Log.Write(xe);
                    throw;
                }
            }
        }

        private async Task DeleteDirectory(Directory dir)
        {
            foreach (Page p in dir.Pages.ToArray())
            {
                DeletePage(p);
            }
            foreach (Directory d in dir.SubDirectories.ToArray())
            {
                await DeleteDirectory(d);
            }
            DataContext.Directories.Remove(dir);
            await DataContext.SaveChangesAsync();
        }
        private async Task DeletePage(long id)
        {
            Page p = DataContext.Pages.Find(id);
            DeletePage(p);
            await DataContext.SaveChangesAsync();
        }

        private void DeletePage(Page p)
        {
            PageMarkup pm = p.PageMarkup;
            DataContext.PageMarkups.Remove(pm);
            DataContext.Pages.Remove(p);
        }
        private string GetUniquePageName(Directory dir)
        {
            string proposedName = "New Page";
            Func<string, bool> nameExists = (name) =>
            {
                return dir.Pages.FirstOrDefault(x => String.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0) != null;
            };
            string newName = proposedName;
            int index = 0;
            while (nameExists(newName))
            {
                newName = string.Format("{0} ({1})", proposedName, ++index);
            }
            return newName;
        }
        private string GetUniqueDirectoryName(Directory dir)
        {
            string proposedName = "New Folder";
            Func<string, bool> nameExists = (name) =>
            {
                return dir.SubDirectories.FirstOrDefault(x => String.Compare(name, x.Name, StringComparison.InvariantCultureIgnoreCase) == 0) != null;
            };
            string newName = proposedName;
            int index = 0;
            while (nameExists(newName))
            {
                newName = string.Format("{0} ({1})", proposedName, ++index);
            }
            return newName;
        }
    }
}
