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
            var directories = DataContext.Directories.Where(d => d.ParentDirectory.DirectoryId == id.Value).Select(x => new { Id = x.DirectoryId, Name = x.Name, SubdirectoryCount = x.SubDirectories.Count() });
            return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, directories));
        }
        [HttpGet]
        [Route("content/{id}")]
        public Task<HttpResponseMessage> GetDirectoryContent(long id)
        {
            var allPages = DataContext.Pages.Where(p => p.DirectoryId == id);
            List<dynamic> pageContent = new List<dynamic>();
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
                    pageContent.Add(new
                    {
                        PageId = page.PageId,
                        Url = page.Url,
                        Name = page.Name,
                        HasBanner = bp,
                        HasLeft = lp,
                        HasRight = rp,
                        LandingPage = page.IsLandingPage
                    });
                }
            }
            return Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, pageContent));
        }
        [HttpPost]
        [Route("createpage")]
        public async Task<HttpResponseMessage> CreateNewPage(dynamic data)
        {
            if (CurrentMemberId != null)
            {
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
                    long pageId = page.PageId;
                    return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK, new { PageId = page.PageId, Url = page.Url }));
                }
                catch (Exception xe)
                {
                    Debug.Print(xe.Message);
                    throw;
                }
            }
            return await Task.FromResult(this.Request.CreateResponse(HttpStatusCode.OK));
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
    }
}
