using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    // Note: 10May2015
    // I would like to get rid of PanelPage and possibly also Panel in the future
    // because we now style using CSS and I think it may be possible to do without these tables altogether.
    // It may also be possible to rid of the PageMarkup table!
    // To help with this I am intoducing a new enum called ContentPanels

    public enum ContentPanels
    {
        Centre,
        Banner,
        Left,
        Right
    }

    // these can be used to obtain the content using

    public class PageContent
    {
        public string HtmlText { get; set; }
        public long HtmlTextLength { get; set; }
        public string HtmlStyles { get; set; }
    }
    public partial class Page
    {
        private ICollection<Document> documents;
        private ICollection<Page> forwardLinks;
        //
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
        public long PageId { get; set; }
        public string Name { get; set; }
        public MarkupType MarkupType { get; set; }
        public PageType Type { get; set; }
        public int VersionCount { get; set; }
        public long DirectoryId { get; set; }
        public bool IsLandingPage { get; set; }
        public string InheritSideContentFromUrl { get; set; }
        public bool Visible { get; set; }
        public bool Locked { get; set; }
        public bool Deleted { get; set; }
        public long? OriginalTopicId { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }
        public virtual PageMarkup PageMarkup { get; set; }
        public virtual Directory Directory { get; set; }
        public virtual ICollection<Menu> Menus { get; set; }
        public virtual ICollection<Document> Documents // this page hyperlinks to these document
        {
            get { return documents ?? (documents = new HashSet<Document>()); }
            set { documents = value; }
        }
        [InverseProperty("CentrePage")]
        public virtual ICollection<PanelPage> SidePanelPages { get; set; }
        [InverseProperty("Page")]
        public virtual ICollection<PanelPage> CentrePanelPages { get; set; }
        public virtual ICollection<Page> ForwardLinks // this page hyperlinks to these document
        {
            get { return forwardLinks ?? (forwardLinks = new HashSet<Page>()); }
            set { forwardLinks = value; }
        }
        public virtual ICollection<Page> BackLinks { get; set; } // this page is hyperlinked from these pages
        //public virtual ICollection<PageAccessRule> PageAccessRules { get; set; }
        [NotMapped]
        public string Url
        {
            get { return string.Format("page/{0}", PageId); }
        }
        [NotMapped]
        public System.DateTimeOffset CreatedOn { get { return this.PageMarkup.CreatedOn; } }
        [NotMapped]
        public string CreatedBy { get { return this.PageMarkup.CreatedBy; } }
        [NotMapped]
        public System.DateTimeOffset? ModifiedOn { get { return this.PageMarkup.ModifiedOn; } }
        [NotMapped]
        public string ModifiedBy { get { return this.PageMarkup.ModifiedBy; } }
        [NotMapped]
        public PageContent this[ContentPanels index]
        {
            get { return GetContent(index); }
        }
        [NotMapped]
        public bool IsCentrePage { get { return this.CentrePanelPages.Count() == 0; } }
        [NotMapped]
        [Obsolete]
        public string SidePageInfo
        {
            get { return getSidePageInfo(); }
        }
        public string GetLandingPageImageUrl()
        {
            if (this.IsLandingPage)
            {
                return "content/images/homepage.png";
            }
            else
            {
                return null;
            }
        }
        public string GetTypeImageUrl()
        {
            string r = null;
            switch (this.Type)
            {
                case PageType.Centre:
                    r = "Content/images/centrepage.png";
                    break;
                case PageType.Left:
                    r = "Content/images/leftpage.png";
                    break;
                case PageType.Right:
                    r = "Content/images/rightpage.png";
                    break;
                case PageType.Banner:
                    r = "Content/images/bannerpage.png";
                    break;
                default:
                    r = "Content/images/panelwire.jpg";
                    break;
            }
            return r;
        }
        public string GetTypeTooltip()
        {
            string r = null;
            switch (this.Type)
            {
                case PageType.Centre:
                    r = "Centre page";
                    break;
                case PageType.Left:
                    r = "Left Panel page";
                    break;
                case PageType.Right:
                    r = "Right Panel page";
                    break;
                case PageType.Banner:
                    r = "Banner page";
                    break;
                default:
                    r = "Unknown!";
                    break;
            }
            return r;
        }
        private PageContent GetContent(ContentPanels index)
        {
            // replace this routine if I ever get rid of panel, panelpages and pagemarkups!
            Func<ContentPanels, PageMarkup> findPageMarkup = (cp) =>
            {
                string name = cp.ToString() + "Panel";
                Panel panel = Core.GetDataContext().Panels.Single(p => p.Name == name);
                var pp = this.SidePanelPages.SingleOrDefault(x => x.Panel.PanelId == panel.PanelId);
                if (pp != null)
                {
                    return pp.Page.PageMarkup;
                }
                return null;
            };
            PageMarkup pm = null;
            switch (index)
            {
                case ContentPanels.Centre:
                    pm  = this.PageMarkup;
                    break;
                default:
                    pm = findPageMarkup(index);
                    break;
            }

            return pm == null ? null : new PageContent { HtmlStyles = pm.HtmlStyles, HtmlText = pm.HtmlText, HtmlTextLength = pm.HtmlTextLength };
        }
        private string getSidePageInfo()
        {
            if (IsCentrePage)
            {
                string text = string.Empty;
                foreach (var pp in this.SidePanelPages)
                {
                    switch (pp.Panel.Name)
                    {
                        case "BannerPanel":
                            text += "B";
                            break;
                        case "LeftPanel":
                            text += "L";
                            break;
                        case "RightPanel":
                            text += "R";
                            break;
                    }
                }
                return text;
            }
            else
            {
                return string.Empty;
            }
        }
    }
    public partial class CoreDataContext
    {
        public Page CreateNewPage()
        {
            long largest = 0;
            if ((this.Pages.Count() + this.Pages.Local.Count()) > 0)
            {
                largest = this.Pages.Select(x => x.PageId).Union(this.Pages.Local.Select(x => x.PageId)).Max(x => x);
            }
            //Debug.Print("Page: largest pk = {0}", largest);
            Page p = new Page { PageId = largest + 1 };
            p.PageMarkup = new PageMarkup();

            this.Pages.Add(p);
            return p;
        }
        //public Page GetDefaultLandingPage()
        //{
        //    Group everyone = Group.Everyone;
        //    PageAccessRule par = this.PageAccessRules.Where(x => x.Group.GroupId == everyone.GroupId)
        //        .First(p => p.AccessRule.Allow == true && p.AccessRule.Permission == Permission.ViewPages);
        //    return par.Page;
        //}
    }
}