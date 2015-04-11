using Fastnet.Webframe.CoreData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Areas.Designer.Controllers
{
    [RouteArea("designer")]
    //[RoutePrefix("designer")]
    public class HomeController : Controller
    {
        private CoreDataContext DataContext = Core.GetDataContext();
        // GET: Designer/Home
        [Route("home")]
        [Route("")]
        public ActionResult Index()
        {
            if (!IsPermitted())
            {
                return RedirectToAction("PermissionDenied");
            }
            return View();
        }
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
                return Group.Designers.Members.Contains(member);
            }
            else
            {
                return false;
            }
        }
    }
}