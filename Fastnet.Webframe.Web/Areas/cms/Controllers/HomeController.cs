using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Fastnet.Webframe.Web.Common;
using Fastnet.Webframe.Mvc;

namespace Fastnet.Webframe.Web.Areas.cms.Controllers
{
    [RouteArea("cms")]
    //[RoutePrefix("reports")]
    [VerifySession]
    [PermissionFilter(SystemGroups.Administrators, "CMS features are not available")]
    public class HomeController : BaseMvcController
    {

        private CoreDataContext DataContext = Core.GetDataContext();
        [Route("home")]
        [Route("")]
        public ActionResult Index()
        {
            PageContent bannerContent = Member.Anonymous.FindLandingPage()[PageType.Banner];
            return View();
        }
        [Route("report/{name}")]
        public ActionResult RunReport(string name)
        {
            PageContent bannerContent = Member.Anonymous.FindLandingPage()[PageType.Banner];
            ViewBag.RunReport = name;
            return View("Index");
        }
    }
}