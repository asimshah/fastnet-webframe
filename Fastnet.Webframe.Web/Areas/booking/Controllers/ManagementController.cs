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
    [PermissionFilter(SystemGroups.Administrators)]
    public class ManagementController : BaseMvcController
    {
        // GET: booking/Management
        [Route("admin")]
        public ActionResult Index()
        {
            return View();
        }
    }
}