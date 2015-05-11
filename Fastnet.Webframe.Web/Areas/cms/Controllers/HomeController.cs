using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Fastnet.Webframe.Web.Common;

namespace Fastnet.Webframe.Web.Areas.cms.Controllers
{
    [RouteArea("cms")]
    public class HomeController : Controller
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        [Route("home")]
        [Route("")]
        //[Route("asimx")]
        public ActionResult Index()
        {
            if (!IsPermitted())
            {
                return RedirectToAction("PermissionDenied");
            }
            PageContent bannerContent = DataContext.GetDefaultLandingPage()[ContentPanels.Banner];
            return View();
        }
        [Route("permissiondenied")]
        public ActionResult PermissionDenied()
        {
            return View();
        }
        private bool IsPermitted()
        {
            if (User.Identity.IsAuthenticated)
            {
                //var user = await UserManager.FindByEmailAsync(User.Identity.Name);
                Member member = DataContext.Members.Single(m => m.EmailAddress == User.Identity.Name);
                return Group.Editors.Members.Contains(member);
            }
            else
            {
                return false;
            }
        }
        private void xxx()
        {
            Page home = DataContext.GetDefaultLandingPage();
            PanelPage bannerpp = home.SidePanelPages.SingleOrDefault(pp => pp.Panel.PanelId == Panel.BannerPanel.PanelId);
            Page bannerPage = bannerpp != null ? bannerpp.Page : null;
        }
    }
}