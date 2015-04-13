using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Hosting;

namespace Fastnet.Webframe.CoreData
{
    [Flags]
    public enum CSSComponents
    {
        Background = 1,
        Font = 2,
        Colour = 4,
        Alignment = 8,
        Padding = 16,
        Margin = 32,
        Border = 64,
        Visibility = 128,
        Height = 256,
        Width = 512 
    }
    public class CSSRule
    {
        private static Regex comments = new Regex(@"/\*.*?\*/", RegexOptions.Compiled);
        private static Regex rule = new Regex(@"(.*?)({.*?})", RegexOptions.Compiled | RegexOptions.Singleline);
        public string Selector { get; set; }
        public List<string> Rules { get; set; }
        public CSSRule()
        {
            Rules = new List<string>();
        }
        public void AddRule(string fmt, params object[] args)
        {
            Rules.Add(string.Format(fmt, args));
        }
        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("{0}", Selector).AppendLine();

            sb.AppendFormat("{{").AppendLine();
            foreach (string r in Rules)
            {
                sb.AppendFormat("    {0};", r).AppendLine();
            }
            sb.AppendFormat("}}").AppendLine();
            return sb.ToString();
        }
        public static string GetDefaultCSSFolder()
        {
            return HostingEnvironment.MapPath("~/Content/Main/DefaultCSS");
        }
        public static string GetCustomCSSFolder()
        {
            return HostingEnvironment.MapPath("~/Content/Main/CustomCSS");
        }
        public static string GetUserImagesRelativePath()
        {
            string sitePath = GetDefaultCSSFolder();// HostingEnvironment.MapPath("~/");
            string userImagesPath = GetUserImagesFolder();
            return Win32IO.PathRelativePathTo(sitePath, userImagesPath).Replace("\\", "/");
        }
        public static string GetUserImagesFolder()
        {
            return HostingEnvironment.MapPath("~/UserImages");
        }
        public static List<CSSRule> ParseForRules(string cssRuleText)
        {
            List<CSSRule> rules = new List<CSSRule>();
            cssRuleText = cssRuleText.Replace("<!--", " ");
            cssRuleText = cssRuleText.Replace("-->", " ");
            cssRuleText = cssRuleText.Replace("\r\n", " ");

            cssRuleText = comments.Replace(cssRuleText, "");

            foreach (Match m in rule.Matches(cssRuleText))
            {
                CSSRule cr = new CSSRule();
                cr.Selector = m.Groups[1].Value.Trim();
                string body = m.Groups[2].Value.Trim();
                body = body.Substring(1, body.Length - 2);
                string[] bodyParts = body.Split(';');

                foreach (string bp in bodyParts)
                {
                    if (bp.Trim().Length > 0)
                    {

                        cr.Rules.Add(bp.Trim());
                    }
                }
                rules.Add(cr);
            }
            return rules;
        }
    }
    public partial class CoreDataContext
    {
        public void CreateCSSFromPanels()
        {
            var folder = CSSRule.GetDefaultCSSFolder();// HostingEnvironment.MapPath("~/Content/Main/AppCSS");
            string[] panelList = new string[] {
                     "BrowserPanel",
                     "SitePanel",
                     "CentrePanel",
                     "BannerPanel",
                     "MenuPanel",
                     "ContentPanel",
                     "LeftPanel",
                     "RightPanel"
            };
            foreach (var panel in panelList)
            {
                string cssText;
                switch (panel)
                {
                    case "BrowserPanel":
                        cssText = Panel.BrowserPanel.GetCSSString();
                        break;
                    case "SitePanel":
                        cssText = Panel.SitePanel.GetCSSString();
                        break;
                    case "CentrePanel":
                        cssText = Panel.CentrePanel.GetCSSString();
                        break;
                    case "BannerPanel":
                        cssText = Panel.BannerPanel.GetCSSString();
                        break;
                    case "MenuPanel":
                        cssText = Panel.MenuPanel.GetCSSString();
                        break;
                    case "ContentPanel":
                        cssText = Panel.ContentPanel.GetCSSString();
                        break;
                    case "LeftPanel":
                        cssText = Panel.LeftPanel.GetCSSString();
                        break;
                    case "RightPanel":
                        cssText = Panel.RightPanel.GetCSSString();
                        break;
                    default:
                        throw new ApplicationException("CreateCSSFiles(): unknown panel");
                }
                string cssFileName = System.IO.Path.Combine(folder, panel + ".css");
                System.IO.File.WriteAllText(cssFileName, cssText);
            }
            string menuCssText = Menu.GetCSSString();
            string menuCssFile = System.IO.Path.Combine(folder, "Menu.css");
            System.IO.File.WriteAllText(menuCssFile, menuCssText);
        }
    }
}
