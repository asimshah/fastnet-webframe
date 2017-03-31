using Fastnet.EventSystem;
using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.WebApi;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Core.Objects;
using System.Data.Entity.Infrastructure;
using System.Dynamic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;


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
                Restrictions = d.DirectoryGroups.Select(x => new { Group = x.Group.Fullpath, View = x.ViewAllowed, Edit = x.EditAllowed, Access = x.GetAccessDescription(), Weight = x.Group.Weight }),
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
                //LandingPageImage = "/" + Page.GetLandingPageImageUrl(),
                //PageTypeImage = "/" + p.GetTypeImageUrl(),
                LandingPageImage = Page.GetLandingPageImageUrl(),
                PageTypeImage = p.GetTypeImageUrl(),
                PageTypeTooltip = p.GetTypeTooltip(),
                LastModifiedOn = p.ModifiedOn ?? p.CreatedOn,
                LastModifiedBy = p.ModifiedOn.HasValue ? p.ModifiedBy : p.CreatedBy
            }));
            list.AddRange(documents.Select(d => new
            {
                Type = "document",
                Id = d.DocumentId,
                Name = d.Name,
                Url = d.Url,
                DocumentTypeImage = "/" + d.GetTypeImageUrl(),
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
                ImageTypeImage = "/" + x.GetImageTypeImage()
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
        [Route("~/cms/get/ss/membershiphistory")]
        public async Task<dynamic> GetMembershipHistoryPaged()
        {
            var query = HttpUtility.ParseQueryString(this.Request.RequestUri.Query);
            int draw = Convert.ToInt32(query["draw"]);
            int start = Convert.ToInt32(query["start"]);
            int length = Convert.ToInt32(query["length"]);
            var all = await DataContext.Actions.OfType<MemberAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            var total = all.Count();
            dynamic data = new ExpandoObject();
            data.draw = draw;// = 57;
            data.recordsTotal = total;
            data.recordsFiltered = total;
            var selected = all.Skip(start).Take(length);
            List<string[]> l = new List<string[]>();
            foreach (MemberAction ma in selected)
            {
                string ro = ma.RecordedOn.UtcDateTime.ToString("ddMMMyyyy HH:mm:ss");
                string an = ma.ActionName;
                string ea = ma.EmailAddress;
                string fn = ma.FullName;
                string ab = ma.ActionBy;
                string pc = null;
                string ov = null;
                string nv = null;
                if (ma.IsModification)
                {
                    pc = ma.PropertyChanged;
                    ov = ma.OldValue;
                    nv = ma.NewValue;
                }
                var x = new string[]
                {
                    ro,
                    an,
                    ea,
                    fn,
                    ab,
                    pc,
                    ov,
                    nv
                };
                l.Add(x);
            }
            //for(int i = 0; i < 10;++i)
            //{
            //    var x = new string[]
            //    {
            //        "Airi",
            //        "Satou",
            //        "Accountant",
            //        "Tokyo",
            //        "28th Nov 08",
            //        "$162,700",
            //        "xxx",
            //        "yyyy"
            //    };
            //    l.Add(x);
            //}
            data.data = l.ToArray();
            return data;
            //var data = await DataContext.Actions.OfType<MemberAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            //return this.Request.CreateResponse(HttpStatusCode.OK, data);
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
            Func<string, bool, string, bool, string, string> buildText = (failure, redirected, redirectedTo, disabled, remark) =>
            {
                List<string> parts = new List<string>();
                if(!string.IsNullOrWhiteSpace(remark))
                {
                    parts.Add(remark);
                }
                if(redirected)
                {
                    parts.Add($"Redirected to {redirectedTo}");
                }
                if(disabled)
                {
                    parts.Add("Mail is disabled");
                }
                if(!string.IsNullOrWhiteSpace(failure))
                {
                    parts.Add(failure);
                }
                return string.Join(" ", parts);
            };
            Func<string, bool,  bool,  string> buildClasses = (failure, redirected,  disabled) =>
            {
                List<string> parts = new List<string>();
                if (redirected)
                {
                    parts.Add("redirectedto");
                }
                if (disabled)
                {
                    parts.Add("mail-disabled");
                }
                if (!string.IsNullOrWhiteSpace(failure))
                {
                    parts.Add("mail-failed-delivery");
                }
                return string.Join(" ", parts);
            };
            var ctx = ((IObjectContextAdapter)DataContext).ObjectContext;
            var mails = await DataContext.Actions.OfType<MailAction>().OrderByDescending(x => x.RecordedOn).ToArrayAsync();
            await ctx.RefreshAsync(RefreshMode.StoreWins, mails);
            var data = mails.Select(x => new
            {
                ActionBaseId = x.ActionBaseId,
                Failure = x.Failure,
                From = x.From,
                //MailBody = x.MailBody,
                MailDisabled = x.MailDisabled,
                MailTemplate = x.MailTemplate,
                RecordedOn = x.RecordedOn.UtcDateTime.ToString("ddMMMyyyy HH:mm:ss"),
                RecordedOnUnix = x.RecordedOn.ToUnixTimeSeconds(),
                Redirected = x.Redirected,
                RedirectedTo = x.RedirectedTo,
                Subject = x.Subject,
                To = x.To,
                Remark = x.Remark,
                CombinedDescription = buildText(x.Failure, x.Redirected, x.RedirectedTo, x.MailDisabled, x.Remark),
                CombinedDescriptionClasses = buildClasses(x.Failure, x.Redirected, x.MailDisabled)
            });
            return this.Request.CreateResponse(HttpStatusCode.OK, data);
        }
        [HttpGet]
        [Route("get/mail/body/{id}")]
        public HttpResponseMessage GetMailBody(long id)
        {
            var mail = DataContext.Actions.OfType<MailAction>().Single(x => x.ActionBaseId == id);
            return this.Request.CreateResponse(HttpStatusCode.OK, mail.MailBody);
        }
        [HttpPost]
        [Route("sendmail")]
        public HttpResponseMessage SendEmail(dynamic data)
        {
            string to = data.to;
            string subject = data.subject;
            string body = data.body;
            //MailHelper mh = new MailHelper();
            //await mh.SendMailAsync(to, subject, body, "TestMail");
            MailHelper mh = new MailHelper();
            mh.SendTestMailAsync(DataContext, to, subject, body);
            Log.Write("cmscontroller(): mailhelper called for testmail");
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
