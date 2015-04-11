using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace Fastnet.Webframe.CoreData
{
    public partial class Menu
    {
        public long MenuId { get; set; }
        [ForeignKey("ParentMenu")]
        public long? ParentMenuId { get; set; }
        public int Sequence { get; set; }
        public string Text { get; set; }
        public int AccessibilityCode { get; set; }
        public string Url { get; set; }
        public bool Visible { get; set; }
        public int? PixelWidth { get; set; }
        public int? PixelHeight { get; set; }
        public int? SubMenuPixelWidth { get; set; }
        public int? SubMenuPixelHeight { get; set; }
        public bool InheritParentStyles { get; set; }
        public long? PageId { get; set; }
        [ForeignKey("NormalStyle")]
        public long? NormalStyleId { get; set; }
        [ForeignKey("HoverStyle")]
        public long? HoverStyleId { get; set; }
        [ForeignKey("SelectedStyle")]
        public long? SelectedStyleId { get; set; }
        public bool UseStandardArrows { get; set; }
        public string NormalArrowColour { get; set; }
        public string HighlitArrowColour { get; set; }
        public long? ConvertedFromId { get; set; }
        public System.DateTime LastModified { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }
        [NotMapped]
        public string TagId
        {
            //menu.IsDefault ? "" : string.Format(" #{0}", menu.TagId);
            get { return this.ParentMenu == null ? "" : string.Format("Mid{0}", this.MenuId); }
        }
        public virtual Page Page { get; set; }
        public virtual Menu ParentMenu { get; set; }
        public virtual Style NormalStyle { get; set; }
        public virtual Style HoverStyle { get; set; }
        public virtual Style SelectedStyle { get; set; }
        public virtual ICollection<Menu> SubMenus { get; set; }
        public static string GetCSSString()
        {
            Menu master = Core.GetDataContext().Menus.Single(m => m.ParentMenu == null);
            CSSRule normal = GetNormalCSSRule(master);
            CSSRule hover = GetHoverCSSRule(master);
            StringBuilder sb = new StringBuilder();
            sb.AppendLine(normal.ToString());
            sb.AppendLine(hover.ToString());
            return sb.ToString();
        }

        private static CSSRule GetNormalCSSRule(Menu master)
        {
            CSSRule cr = new CSSRule();
            cr.Selector = ".menu-normal";
            if(master.NormalStyle != null)
            {
                master.NormalStyle.AddFontCSS(cr);
                master.NormalStyle.AddBackgroundCSS(cr);
                master.NormalStyle.AddColourCSS(cr);
            }
            return cr;
        }
        private static CSSRule GetHoverCSSRule(Menu master)
        {
            CSSRule cr = new CSSRule();
            cr.Selector = ".menu-hover:hover";
            if (master.HoverStyle != null)
            {
                master.HoverStyle.AddFontCSS(cr);
                master.HoverStyle.AddBackgroundCSS(cr);
                master.HoverStyle.AddColourCSS(cr);
            }
            return cr;
        }
    }
}