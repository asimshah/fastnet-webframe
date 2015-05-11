using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Dynamic;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{

    public partial class Panel
    {
        public long PanelId { get; set; }
        [ForeignKey("ParentPanel")]
        public long? ParentPanelId { get; set; }
        public string Name { get; set; }
        //public int AccessibilityCode { get; set; }
        public bool Visible { get; set; }
        public System.DateTime LastModified { get; set; }
        public int? PixelHeight { get; set; }
        public int? PixelWidth { get; set; }
        public long? StyleId { get; set; }
        public long? ConvertedFromId { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }
        public virtual Panel ParentPanel { get; set; }
        public virtual Style Style { get; set; }
        public static Panel BrowserPanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "BrowserPanel"); }
        }
        public static Panel SitePanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "SitePanel"); }
        }
        public static Panel BannerPanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "BannerPanel"); }
        }
        public static Panel MenuPanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "MenuPanel"); }
        }
        public static Panel ContentPanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "ContentPanel"); }
        }
        public static Panel LeftPanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "LeftPanel"); }
        }
        public static Panel RightPanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "RightPanel"); }
        }
        public static Panel CentrePanel
        {
            get { return Core.GetDataContext().Panels.Single(p => p.Name == "CentrePanel"); }
        }
        public string GetCSSString()
        {
            CSSRule cr = GetCSSRule();
            return cr.ToString();
        }
        //public static void GetPanelCSS()
        //{
        //    Func<Panel, CSSComponents, CSSRule> buildRules = (panel, csc) =>
        //    {
        //        CSSRule rules = new CSSRule();
        //        rules.Selector = string.Format(".{0}", panel.Name);
        //        if (panel.Style != null)
        //        {
        //            AddCSS(panel.Style, rules, csc);
        //            panel.AddCSS(rules, csc);
        //        }
        //        return rules;
        //    };
        //    CSSRule browserPanelRules = buildRules(Panel.BrowserPanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment);
        //    CSSRule sitePanelRules = buildRules(Panel.SitePanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour
        //            | CSSComponents.Alignment | CSSComponents.Padding | CSSComponents.Border);
        //    CSSRule bannerPanelRules = buildRules(Panel.BannerPanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment
        //        | CSSComponents.Margin | CSSComponents.Padding | CSSComponents.Visibility
        //        | CSSComponents.Height); // what about the width?
        //    CSSRule menuPanelRules = buildRules(Panel.MenuPanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment
        //        | CSSComponents.Margin | CSSComponents.Padding | CSSComponents.Border | CSSComponents.Visibility
        //        | CSSComponents.Height); // what about the width
        //    CSSRule contentPanelRules = buildRules(Panel.ContentPanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment
        //        | CSSComponents.Margin | CSSComponents.Padding | CSSComponents.Border);
        //    CSSRule leftPanelRules = buildRules(Panel.LeftPanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment
        //        | CSSComponents.Padding | CSSComponents.Border | CSSComponents.Visibility);
        //    CSSRule centrePanelRules = buildRules(Panel.CentrePanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment
        //        | CSSComponents.Padding | CSSComponents.Border);
        //    CSSRule rightPanelRules = buildRules(Panel.RightPanel,
        //        CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment
        //        | CSSComponents.Padding | CSSComponents.Border | CSSComponents.Visibility);

        //}
        private CSSRule GetCSSRule()
        {
            CSSComponents csc;
            switch (this.Name)
            {
                case "BrowserPanel":
                    csc = CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment;
                    break;
                case "SitePanel":
                case "CentrePanel":
                    csc = CSSComponents.Width | CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment | CSSComponents.Padding | CSSComponents.Border;
                    break;
                case "BannerPanel":
                    csc = CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment | CSSComponents.Padding | CSSComponents.Margin | CSSComponents.Border | CSSComponents.Visibility | CSSComponents.Height;
                    break;
                case "MenuPanel":
                    csc = CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment | CSSComponents.Padding | CSSComponents.Margin | CSSComponents.Border | CSSComponents.Visibility | CSSComponents.Height;
                    break;
                case "ContentPanel":
                    csc = CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment | CSSComponents.Padding | CSSComponents.Margin | CSSComponents.Border;
                    break;
                case "LeftPanel":
                case "RightPanel":
                    csc = CSSComponents.Width | CSSComponents.Background | CSSComponents.Font | CSSComponents.Colour | CSSComponents.Alignment | CSSComponents.Padding | CSSComponents.Border | CSSComponents.Visibility;
                    break;
                default:
                    throw new ApplicationException("GetCSSRule(): unknown panel");
            }
            CSSRule rules = new CSSRule();
            rules.Selector = string.Format(".{0}", Name);
            if (Style != null)
            {
                AddCSS(Style, rules, csc);
                AddCSS(rules, csc);
            }
            return rules;
        }
        //private dynamic GetPanelSize()
        //{
        //    dynamic sizes = new ExpandoObject();
        //    sizes.Width = PixelWidth ?? null;
        //    sizes.Height = PixelHeight ?? null;
        //    dynamic marginInfo = this.Style.GetMarginInfo();
        //    dynamic paddingInfo = this.Style.GetPaddingInfo();
        //    dynamic borderInfo = this.Style.GetBorderInfo();
        //    sizes.TotalMarginWidth = marginInfo.Left + marginInfo.Right;
        //    sizes.TotalMarginHeight = marginInfo.Top + marginInfo.Bottom;
        //    sizes.TotalPaddingWidth = paddingInfo.Left + paddingInfo.Right;
        //    sizes.TotalPaddingnHeight = paddingInfo.Top + paddingInfo.Bottom;
        //    sizes.TotalBorderWidth = borderInfo.Left.Width + borderInfo.Right.Width;
        //    sizes.TotalBorderHeight = borderInfo.Top.Width + borderInfo.Bottom.Width;
        //    return sizes;
        //}
        private void AddCSS(CSSRule cr, CSSComponents csc)
        {
            if (csc.HasFlag(CSSComponents.Visibility) && !Visible)
            {
                cr.AddRule("display: none");
            }
            if (csc.HasFlag(CSSComponents.Height))
            {
                cr.AddRule("height: {0}px", PixelHeight ?? 0);
            }
            if (csc.HasFlag(CSSComponents.Width))
            {
                cr.AddRule("width: {0}px", PixelWidth ?? 0);
            }
        }
        private static void AddCSS(Style style, CSSRule cr, CSSComponents csc)
        {
            if (csc.HasFlag(CSSComponents.Background))
            {
                style.AddBackgroundCSS(cr);
            }
            if (csc.HasFlag(CSSComponents.Font))
            {
                style.AddFontCSS(cr);
            }
            if (csc.HasFlag(CSSComponents.Colour))
            {
                style.AddColourCSS(cr);
            }
            if (csc.HasFlag(CSSComponents.Alignment))
            {
                style.AddAlignmentCSS(cr);
            }
            if (csc.HasFlag(CSSComponents.Padding))
            {
                style.AddPaddingCSS(cr);
            }
            if (csc.HasFlag(CSSComponents.Padding))
            {
                style.AddMarginCSS(cr);
            }
            if (csc.HasFlag(CSSComponents.Border))
            {
                style.AddBorderCSS(cr);
            }
        }
    }
}