using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class PageMarkup
    {
        //public long PageMarkupId { get; set; }
        [Key, ForeignKey("Page")]
        public long PageId { get; set; }
        public System.DateTimeOffset CreatedOn { get; set; }
        public string CreatedBy { get; set; }
        
        public System.DateTimeOffset? ModifiedOn { get; set; }
        public string ModifiedBy { get; set; }
        //public int VersionNumber { get; set; }
        //public int MarkupTypeCode { get; set; }
        //public string WordMlText { get; set; }
        public byte[] Data { get; set; }
        public long MarkupLength { get; set; }
        public string HtmlText { get; set; }
        public long HtmlTextLength { get; set; }
        public string HtmlStyles { get; set; }
        public string HtmlScripts { get; set; }
        public byte[] ThumbNail { get; set; }
        public byte[] SmallThumbNail { get; set; }
        public byte[] MiddleThumbNail { get; set; }
        [Timestamp]
        public byte[] TimeStamp { get; set; }

        public virtual Page Page { get; set; }
        //public virtual ICollection<MarkupDocumentLink> DocumentLinks { get; set; }
        //public virtual ICollection<MarkupPageLink> PageLinks { get; set; }
        [NotMapped]
        public System.DateTime LastModifiedOn
        {
            get
            {
                if (ModifiedOn.HasValue)
                {
                    return ModifiedOn.Value.UtcDateTime;
                }
                else
                {
                    return CreatedOn.UtcDateTime;
                }
                //return ModifiedOn ?? CreatedOn.DateTime;
            }
        }
    }
}