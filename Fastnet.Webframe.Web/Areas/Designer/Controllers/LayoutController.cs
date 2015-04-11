﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.Web.Areas.Designer.Controllers
{
    [RouteArea("designer")]
    [RoutePrefix("layout")]
    public class LayoutController : Controller
    {
        // GET: Designer/Panel
        [Route("")]
        public ActionResult Index()
        {
            return View();
        }
    }
}