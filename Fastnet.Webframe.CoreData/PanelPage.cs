using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Fastnet.Webframe.CoreData
{
    public partial class PanelPage
    {
        public long PanelPageId { get; set; }
        [ForeignKey("CentrePage")]
        public long CentrePageId { get; set; }
        public long PanelId { get; set; }
        [ForeignKey("Page")]
        public long PageId { get; set; }
        [Timestamp]
        public byte[] Timestamp { get; set; }

        public virtual Page Page { get; set; }
        public virtual Page CentrePage { get; set; }
        public virtual Panel Panel { get; set; }
    }
}