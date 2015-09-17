using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Areas.booking.Controllers
{
    [RouteArea("booking")]
    [VerifySession]
    //[PermissionFilter(SystemGroups.Administrators, "Booking features are not available")]
    public class HomeController : BaseMvcController
    {
        //private CoreDataContext DataContext;
        // GET: booking/Home
        [Route("home")]
        [Route("")]
        public ActionResult Index()
        {
            return View();
        }
    }
}