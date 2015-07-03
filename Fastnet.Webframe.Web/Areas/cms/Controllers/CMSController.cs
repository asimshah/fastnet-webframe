using Fastnet.Webframe.CoreData;
using System;
using System.Data.Entity;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using Fastnet.Webframe.Web.Common;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Core.Objects;
using Fastnet.Webframe.WebApi;


namespace Fastnet.Webframe.Web.Areas.cms.Controllers
{
    [RoutePrefix("cmsapi")]
    [PermissionFilter(SystemGroups.Administrators)]
    public class CMSController : BaseApiController
    {

        private CoreDataContext DataContext = Core.GetDataContext();
        [HttpGet]
        [Route("banner")]
        public HttpResponseMessage GetBannerHtml()
        {
            //PageContent bannerContent = DataContext.GetDefaultLandingPage()[ContentPanels.Banner];
            PageContent bannerContent = Member.Anonymous.FindLandingPage()[PageType.Banner];
            if (bannerContent != null)
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = true, Styles = bannerContent.HtmlStyles, Html = bannerContent.HtmlText });
            }
            else
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, new { Success = false });
            }
            //return this.Request.CreateResponse(HttpStatusCode.OK, new { Styles = bannerContent.HtmlStyles, Html = bannerContent.HtmlText });
        }
        [HttpGet]
        [Route("get/folders")]
        public HttpResponseMessage GetDirectories()
        {
            IEnumerable<Directory> result = GetFlattenedDirectories();
            var folders = result.Select(d => new
            {
                Path = d.DisplayName,
                Id = d.DirectoryId,
                Restrictions = d.DirectoryGroups.Select(x => new { Group = x.Group.Fullpath, View = x.ViewAllowed, Edit = x.EditAllowed, Access = x.GetAccessDescription(), Weight = x.Group.Weight}),
                InheritedRestrictions = d.GetClosestDirectoryGroups().Select(x => new { Group = x.Group.Fullpath, View = x.ViewAllowed, Edit = x.EditAllowed, Access = x.GetAccessDescription(), Weight = x.Group.Weight })
            }); // add properties here as required
            return this.Request.CreateResponse(HttpStatusCode.OK, folders);
        }
        [HttpGet]
        [Route("get/groups")]
        public async Task<HttpResponseMessage> GetAllGroups()
        {
            List<Group> groups = new List<Group>();
            Func<Group, Task> readChildren = null;
            readChildren = async (g) =>
            {
                var list = await DataContext.Groups.Where(x => x.ParentGroupId == g.GroupId).OrderBy(x => x.Name).ToArrayAsync();
                foreach (var item in list)
                {
                    groups.Add(item);
                    await readChildren(item);
                }
            };
            Group root = await DataContext.Groups.SingleAsync(x => x.ParentGroup == null);
            groups.Add(root);
            await readChildren(root);
            var result = groups.Select(g => new
            {
                Id = g.GroupId,
                Name = g.Name,
                FullPath = g.Fullpath,
                Description = g.Description,
                Weight = g.Weight,
                HasDirectories = g.DirectoryGroups.Count() > 0,
                Directories = g.DirectoryGroups.Select(x => new
                {
                    Path = x.Directory.DisplayName,
                    View = x.ViewAllowed,
                    Edit = x.EditAllowed
                })
            });
            return this.Request.CreateResponse(HttpStatusCode.OK, result);
        }
        [HttpGet]
        [Route("get/foldercontent/{id}")]
        public HttpResponseMessage GetDirectoryContent(long id)
        {
            List<dynamic> list = new List<dynamic>();
            Directory dir = DataContext.Directories.Find(id);
            var pages = dir.Pages.ToArray().OrderBy(p => p.Url);
            var documents = dir.Documents.ToArray().OrderBy(d => d.Url);
            var images = dir.Images.ToArray().OrderBy(x => x.Url);
            list.AddRange(pages.Select(p => new
            {
                Type = "page",
                Id = p.PageId,
                Name = p.Name,
                Url = p.Url,
                LandingPage = p.IsLandingPage,
                PageType = p.Type,
                LandingPageImage = Page.GetLandingPageImageUrl(),
                PageTypeImage = p.GetTypeImageUrl(),
                PageTypeTooltip = p.GetTypeTooltip(),
                LastModifiedOn = p.ModifiedOn ?? p.CreatedOn,
                LastModifiedBy = p.ModifiedOn.HasValue ? p.ModifiedBy: p.CreatedBy
            }));
            list.AddRange(documents.Select(d => new
            {
                Type = "document",
                Id = d.DocumentId,
                Name = d.Name,
                Url = d.Url,
                DocumentTypeImage = d.GetTypeImageUrl(),
                LastModifiedOn = d.CreatedOn,
                LastModifiedBy = d.CreatedBy
            }));
            list.AddRange(images.Select(x => new
            {
                Type = "image",
                Id = x.ImageId,
                Name = x.Name,
                Url = x.Url,
                Info = x.Size,
                LastModifiedOn = x.CreatedOn,
                LastModifiedBy = x.CreatedBy,
                ImageTypeImage = x.GetImageTypeImage()
            }));
            return this.Request.CreateResponse(HttpStatusCode.OK, list);
        }
        [HttpGet]
        [Route("get/sessionhistory")]
        public async Task<HttpResponseMessage> GetSessionHistory()
        {
            var data = await DataContext.Actions.OfType<SessionAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK, data);
        }
        [HttpGet]
        [Route("get/membershiphistory")]
        public async Task<HttpResponseMessage> GetMembershipHistory()
        {
            var data = await DataContext.Actions.OfType<MemberAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK, data);
        }
        [HttpGet]
        [Route("get/grouphistory")]
        public async Task<HttpResponseMessage> GetGroupHistory()
        {
            var data = await DataContext.Actions.OfType<GroupAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK, data);
        }
        [HttpGet]
        [Route("get/contenthistory")]
        public async Task<HttpResponseMessage> GetContentHistory()
        {
            var data = await DataContext.Actions.OfType<EditingAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            return this.Request.CreateResponse(HttpStatusCode.OK, data);
        }
        [HttpGet]
        [Route("get/mailhistory")]
        public async Task<HttpResponseMessage> GetMailHistory()
        {
            var ctx = ((IObjectContextAdapter)DataContext).ObjectContext;
            var data = await DataContext.Actions.OfType<MailAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            await ctx.RefreshAsync(RefreshMode.StoreWins, data);
            return this.Request.CreateResponse(HttpStatusCode.OK, data);
        }
        [HttpPost]
        [Route("sendmail")]
        public async Task<HttpResponseMessage> SendEmail(dynamic data)
        {
            string to = data.to;
            string subject = data.subject;
            string body = data.body;
            MailHelper mh = new MailHelper();
            await mh.SendMailAsync(to, subject, body);
            return this.Request.CreateResponse(HttpStatusCode.OK);
        }
        private IEnumerable<Directory> GetFlattenedDirectories()
        {
            List<Directory> list = new List<Directory>();
            Action<Directory> addChildren = null;
            addChildren = (dir) =>
            {
                var children = DataContext.Directories.Where(x => x.ParentDirectory.DirectoryId == dir.DirectoryId).OrderBy(x => x.Name);
                list.AddRange(children);
                foreach (Directory d in children)
                {
                    addChildren(d);
                }
            };
            var root = DataContext.Directories.Single(x => x.ParentDirectory == null);
            list.Add(root);
            addChildren(root);
            return list;
        }
    }
}
