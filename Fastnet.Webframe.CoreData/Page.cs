using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class Page
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
        public long PageId { get; set; }
        public string Name { get; set; }
        public MarkupType MarkupType { get; set; }
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

        private ICollection<Document> documents;
        public virtual ICollection<Document> Documents // this page hyperlinks to these document
        {
            get { return documents ?? (documents = new HashSet<Document>()); }
            set { documents = value; }
        }
        [InverseProperty("CentrePage")]
        public virtual ICollection<PanelPage> SidePanelPages { get; set; }
        [InverseProperty("Page")]
        public virtual ICollection<PanelPage> CentrePanelPages { get; set; }

        private ICollection<Page> forwardLinks;
        public virtual ICollection<Page> ForwardLinks // this page hyperlinks to these document
        {
            get { return forwardLinks ?? (forwardLinks = new HashSet<Page>()); }
            set { forwardLinks = value; }
        }

        public virtual ICollection<Page> BackLinks { get; set; } // this page is hyperlinked from these pages
        public virtual ICollection<PageAccessRule> PageAccessRules { get; set; }
    }
    public partial class CoreDataContext
    {
        long largest = 0;
        public Page CreateNewPage()
        {
            if((this.Pages.Count() + this.Pages.Local.Count()) > 0)
            { 
                largest = this.Pages.Select(x => x.PageId).Union(this.Pages.Local.Select(x => x.PageId)).Max(x => x);
            }
            Debug.Print("Page: largest pk = {0}", largest);
            Page p = new Page { PageId = largest + 1 };
            this.Pages.Add(p);
            return  p;         
        }
    }
}