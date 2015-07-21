using System;
using System.Collections.Generic;
using System.IO;
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
    public static class LayoutFiles
    {
        public static string GetDefaultCSS(string panelName)
        {
            panelName = NormalizePanelName(panelName);
            string filename = Path.Combine(GetMainStylesheetFolder(), panelName + ".css");
            return File.ReadAllText(filename);
        }
        public static string GetCustomLess(string panelName)
        {
            panelName = NormalizePanelName(panelName);
            string filename = Path.Combine(GetCustomStylesheetFolder(), panelName + ".less");
            if (File.Exists(filename))
            {
                return File.ReadAllText(filename);
            }
            else
            {
                return EmptyPanelLessFile(panelName);
            }
        }

        private static string EmptyPanelLessFile(string panelName)
        {
            return string.Format(".{0}\n{{\n\n}}\n", panelName);
        }
        public static string GetHelpText(string cmd)
        {
            string text = "";
            switch (cmd.ToLower())
            {
                case "sitepanel":
                    text = "These rules can be inherited by the entire site (if appropriate). Use width or max-width to control the width of the content. This is also a place to set global values such as font, background colour, foreground colour";
                    break;
                case "bannerpanel":
                    text = "For a banner to be displayed it must have a height. Display of the banner panel can be turned off";
                    break;
                case "menupanel":
                    text = "For a menu to be displayed it must have a height. Display of the menu panel can be turned off";
                    break;
                case "contentpanel":
                    text = "These rules can be inherited by the three child panels, left, centre and right (if appropriate). Do not set height or width";
                    break;
                case "leftpanel":
                    text = "For left panel to be displayed it must have a width. Do not set height. Display of the left panel can be turned off";
                    break;
                case "centrepanel":
                    text = "Do not set the width of the centre panel and do not turn off its display. Site width is best controlled vis the Site panel.";
                    break;
                case "rightpanel":
                    text = "For right panel to be displayed it must have a width. Do not set height. Display of the right panel can be turned off";
                    break;
                default:
                    break;
            }
            return text;
        }
        public static void SaveCustomLess(string panelName, string lessText, string cssText)
        {
            panelName = NormalizePanelName(panelName);
            string filename = Path.Combine(GetCustomStylesheetFolder(), panelName + ".less");
            File.WriteAllText(filename, lessText);
            filename = Path.Combine(GetMainStylesheetFolder(), panelName + ".user.css");
            File.WriteAllText(filename, cssText);
        }
        private static string NormalizePanelName(string name)
        {
            switch (name.ToLower())
            {
                case "site-panel":
                    name = "SitePanel";
                    break;
                case "banner-panel":
                    name = "BannerPanel";
                    break;
                case "menu-panel":
                    name = "MenuPanel";
                    break;
                case "content-panel":
                    name = "ContentPanel";
                    break;
                case "left-panel":
                    name = "LeftPanel";
                    break;
                case "centre-panel":
                    name = "CentrePanel";
                    break;
                case "right-panel":
                    name = "RightPanel";
                    break;
                default:
                    break;
            }
            return name;
        }
        public static string GetMainStylesheetFolder()
        {
            return HostingEnvironment.MapPath("~/Content/Main/DefaultCSS");
        }
        public static string GetCustomStylesheetFolder()
        {
            string folder = HostingEnvironment.MapPath("~/Content/Main/CustomLess");
            if (!System.IO.Directory.Exists(folder))
            {
                System.IO.Directory.CreateDirectory(folder);
            }
            return folder;// HostingEnvironment.MapPath("~/Content/Main/CustomLess");
        }
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
        public void RemoveRule(string name)
        {
            string rule = Rules.SingleOrDefault(x => x.StartsWith(name.ToLower()));
            if (rule != null)
            {
                Rules.Remove(rule);
            }
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
        //public static string GetDefaultCSSFolder()
        //{
        //    return HostingEnvironment.MapPath("~/Content/Main/DefaultCSS");
        //}
        //public static string GetCustomCSSFolder()
        //{
        //    return HostingEnvironment.MapPath("~/Content/Main/CustomLess");
        //}
        public static string GetUserImagesRelativePath()
        {
            string sitePath = LayoutFiles.GetMainStylesheetFolder();// GetDefaultCSSFolder();// HostingEnvironment.MapPath("~/");
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
   // public partial class CoreDataContext
    //{
    //}
}
