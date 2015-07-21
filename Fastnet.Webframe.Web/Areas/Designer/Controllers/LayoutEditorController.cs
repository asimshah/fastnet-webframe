using Fastnet.Webframe.CoreData;
using Fastnet.Webframe.Web.Areas.Designer.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Fastnet.Webframe.Web.Areas.Designer.Controllers
{
    [RoutePrefix("designer/layouteditor")]
    public class LayoutEditorController : ApiController
    {
        [HttpGet]
        [Route("get/{panel}")]
        public HttpResponseMessage GetPanelInformation(string panel)
        {
            Debug.Print("Get recd: GetPanelInformation");
            // convert the panel name to the CSS filename
            // get the contents of the DefaultCSS and any CustomCSS
            // add some help text
            string defaultCSS = LayoutFiles.GetDefaultCSS(panel);
            string customLess = LayoutFiles.GetCustomLess(panel);
            string helpText = LayoutFiles.GetHelpText(panel);// GetHelpText(panel);

            string displayName = string.Empty;
            switch (panel)
            {
                case "site-panel":
                    displayName = "Site Panel";
                    break;
                case "banner-panel":
                    displayName = "Banner Panel";
                    break;
                case "menu-panel":
                    displayName = "Menu Panel";
                    break;
                case "content-panel":
                    displayName = "Content Panel";
                    break;
                case "left-panel":
                    displayName = "Left Panel";
                    break;
                case "centre-panel":
                    displayName = "Centre Panel";
                    break;
                case "right-panel":
                    displayName = "Right Panel";
                    break;
            }
            //Debug.Print("returning: GetPanelInformation");
            return this.Request.CreateResponse(HttpStatusCode.OK, new { Panel = displayName, DefaultCSS = defaultCSS, CustomLess = customLess, HelpText = helpText });
        }
        [HttpPost]
        [Route("savepanelcss")]
        public HttpResponseMessage SaveCSS(SavePanelCSS model)
        {
            LayoutFiles.SaveCustomLess(model.Panel, model.LessText, model.CSSText);
            return this.Request.CreateResponse(HttpStatusCode.OK, new  { Success = true });
        }

    }
}
