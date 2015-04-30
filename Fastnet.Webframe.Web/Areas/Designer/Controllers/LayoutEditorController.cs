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
            string panelCSSFilename = GetCSSFilename(panel);
            string filename = Path.Combine(CSSRule.GetDefaultCSSFolder(), panelCSSFilename);
            string defaultCSS = File.ReadAllText(filename);
            string customLess = string.Empty;
            filename = Path.Combine(CSSRule.GetCustomCSSFolder(), GetLessFilename(panel));
            if(File.Exists(filename))
            {
                customLess = File.ReadAllText(filename);
            }
            string helpText = GetHelpText(panel);
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
            Debug.Print("returning: GetPanelInformation");
            return this.Request.CreateResponse(HttpStatusCode.OK, new { Panel = displayName, DefaultCSS = defaultCSS, CustomLess = customLess, HelpText = helpText });
        }
        [HttpPost]
        [Route("savepanelcss")]
        public HttpResponseMessage SaveCSS(SavePanelCSS model)
        {
            Debug.Print("Post recd: SaveCSS");
            string panelCSSFilename = GetCSSFilename(model.Panel);
            string filename = Path.Combine(CSSRule.GetCustomCSSFolder(), panelCSSFilename);
            File.WriteAllText(filename, model.CSSText);
            string panelLessFilename = GetLessFilename(model.Panel);
            filename = Path.Combine(CSSRule.GetCustomCSSFolder(), panelLessFilename);
            File.WriteAllText(filename, model.LessText);
            Debug.Print("returning: SaveCSS");
            return this.Request.CreateResponse(HttpStatusCode.OK, new  { Success = true });
        }
        private string GetLessFilename(string cmd)
        {
            string name = "";
            switch (cmd)
            {
                case "site-panel":
                    name = "SitePanel.less";
                    break;
                case "banner-panel":
                    name = "BannerPanel.less";
                    break;
                case "menu-panel":
                    name = "MenuPanel.less";
                    break;
                case "content-panel":
                    name = "ContentPanel.less";
                    break;
                case "left-panel":
                    name = "LeftPanel.less";
                    break;
                case "centre-panel":
                    name = "CentrePanel.less";
                    break;
                case "right-panel":
                    name = "RightPanel.less";
                    break;
                default:
                    break;
            }
            return name;
        }
        private string GetCSSFilename(string cmd)
        {
            string name = "";
            switch (cmd)
            {
                case "site-panel":
                    name = "SitePanel.css";
                    break;
                case "banner-panel":
                    name = "BannerPanel.css";
                    break;
                case "menu-panel":
                    name = "MenuPanel.css";
                    break;
                case "content-panel":
                    name = "ContentPanel.css";
                    break;
                case "left-panel":
                    name = "LeftPanel.css";
                    break;
                case "centre-panel":
                    name = "CentrePanel.css";
                    break;
                case "right-panel":
                    name = "RightPanel.css";
                    break;
                default:
                    break;
            }
            return name;
        }
        private string GetHelpText(string cmd)
        {
            string text = "";
            switch (cmd)
            {
                case "site-panel":
                    text = "These rules can be inherited by the entire site (if appropriate). Use width or max-width to control the width of the content. This is also a place to set global values such as font, background colour, foreground colour";
                    break;
                case "banner-panel":
                    text = "For a banner to be displayed it must have a height. Display of the banner panel can be turned off";
                    break;
                case "menu-panel":
                    text = "For a menu to be displayed it must have a height. Display of the menu panel can be turned off";
                    break;
                case "content-panel":
                    text = "These rules can be inherited by the three child panels, left, centre and right (if appropriate). Do not set height or width";
                    break;
                case "left-panel":
                    text = "For left panel to be displayed it must have a width. Do not set height. Display of the left panel can be turned off";
                    break;
                case "centre-panel":
                    text = "Do not set the width of the centre panel and do not turn off its display. Site width is best controlled vis the Site panel.";
                    break;
                case "right-panel":
                    text = "For right panel to be displayed it must have a width. Do not set height. Display of the right panel can be turned off";
                    break;
                default:
                    break;
            }
            return text;
        }
    }
}
