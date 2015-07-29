using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Mvc;
using Fastnet.Webframe.Web.Areas.membership.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Areas.membership.Controllers
{
    [RouteArea("membership")]
    [VerifySession]
    [PermissionFilter(SystemGroups.Administrators, "Membership features are not available")]
    public class HomeController : BaseMvcController
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        // GET: membership/Home
        [Route("home")]
        [Route("")]
        public ActionResult Index()
        {
            if (!IsPermitted())
            {
                return RedirectToAction("PermissionDenied");
            }
            MembershipModel mc = new MembershipModel();
            return View(mc);
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
                var member = DataContext.Members.Single(m => m.EmailAddress == User.Identity.Name);
                return Group.Administrators.Members.Contains(member);
            }
            else
            {
                return false;
            }
        }
    }
}